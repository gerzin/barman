package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"
	"syscall"

	"barman/internal/auth"
	"barman/internal/config"
	"barman/internal/database"
	"barman/internal/domain"
	"barman/internal/repository/postgres"

	"golang.org/x/term"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
		fmt.Fprintf(os.Stderr, "migration error: %v\n", err)
		os.Exit(1)
	}

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "database connection error: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	scanner := bufio.NewScanner(os.Stdin)

	name := prompt(scanner, "Name: ")
	surname := prompt(scanner, "Surname: ")
	email := prompt(scanner, "Email: ")
	password := promptPassword("Password: ")

	hash, err := auth.HashPassword(password)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to hash password: %v\n", err)
		os.Exit(1)
	}

	user := &domain.User{
		Name:         name,
		Surname:      surname,
		Email:        email,
		PasswordHash: hash,
		Role:         domain.RoleAdmin,
	}

	userRepo := postgres.NewUserPostgresRepository(db)
	if err := userRepo.Create(ctx, user); err != nil {
		fmt.Fprintf(os.Stderr, "failed to create user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Superuser %s created with id %s\n", user.Email, user.ID)
}

func prompt(scanner *bufio.Scanner, label string) string {
	fmt.Print(label)
	scanner.Scan()
	return strings.TrimSpace(scanner.Text())
}

func promptPassword(label string) string {
	fmt.Print(label)
	b, err := term.ReadPassword(syscall.Stdin)
	fmt.Println()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to read password: %v\n", err)
		os.Exit(1)
	}
	return string(b)
}
