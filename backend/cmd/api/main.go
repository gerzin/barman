package main

import (
	"context"
	"log/slog"
	"os"

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

	productRepo := postgres.NewProductPostgresRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	menuSectionRepo := postgres.NewMenuSectionPostgresRepository(db)
	menuService := service.NewMenuService(menuSectionRepo)
	menuHandler := handler.NewMenuHandler(menuService)

	router := server.NewRouter(server.Dependencies{
		DB:             db,
		UserHandler:    userHandler,
		ProductHandler: productHandler,
		MenuHandler:    menuHandler,
	})

	if err := router.Run(":" + cfg.Port); err != nil {
		slog.Error("server error", "error", err)
	}
}
