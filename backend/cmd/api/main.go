package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"barman/internal/config"
	"barman/internal/database"
	"barman/internal/handler"
	"barman/internal/repository/postgres"
	"barman/internal/server"
	"barman/internal/service"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
		slog.Error("failed to apply migrations", "error", err)
		return
	}

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		return
	}
	defer db.Close()

	userRepo := postgres.NewUserPostgresRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(authService)

	productRepo := postgres.NewProductPostgresRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	menuSectionRepo := postgres.NewMenuSectionPostgresRepository(db)
	menuService := service.NewMenuService(menuSectionRepo)
	menuHandler := handler.NewMenuHandler(menuService)

	tableRepo := postgres.NewTablePostgresRepository(db)
	tableService := service.NewTableService(tableRepo)
	tableHandler := handler.NewTableHandler(tableService)

	orderRepo := postgres.NewOrderPostgresRepository(db)
	orderLogRepo := postgres.NewOrderLogPostgresRepository(db)
	orderService := service.NewOrderService(orderRepo, orderLogRepo, tableRepo, productRepo)
	orderHandler := handler.NewOrderHandler(orderService)

	publicHandler := handler.NewPublicHandler(tableService, orderService)

	go runTableCleanup(ctx, tableService, cfg.TableRetentionDays, cfg.TableCleanupInterval)

	router := server.NewRouter(server.Dependencies{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		AuthHandler:    authHandler,
		UserHandler:    userHandler,
		ProductHandler: productHandler,
		MenuHandler:    menuHandler,
		TableHandler:   tableHandler,
		OrderHandler:   orderHandler,
		PublicHandler:  publicHandler,
	})

	if err := router.Run(":" + cfg.Port); err != nil {
		slog.Error("server error", "error", err)
	}
}

// runTableCleanup periodically purges tables that have been closed for
// longer than the configured retention period, along with their orders and
// order logs. It runs for the lifetime of the process.
func runTableCleanup(ctx context.Context, tableService *service.TableService, retentionDays int, interval time.Duration) {
	retention := time.Duration(retentionDays) * 24 * time.Hour

	purge := func() {
		count, err := tableService.PurgeClosedTables(ctx, retention)
		if err != nil {
			slog.Error("failed to purge closed tables", "error", err)
			return
		}
		if count > 0 {
			slog.Info("purged closed tables", "count", count)
		}
	}

	purge()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			purge()
		}
	}
}
