package service

import (
	"barman/internal/auth"
	"barman/internal/domain"
	"barman/internal/repository"
	"context"
)

// AuthService authenticates users and issues JWTs.
type AuthService struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret}
}

// Login verifies the given credentials and returns a signed JWT for the
// user along with their profile.
func (s *AuthService) Login(ctx context.Context, email, password string) (string, *domain.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	if err := auth.CheckPassword(user.PasswordHash, password); err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	token, err := auth.GenerateToken(s.jwtSecret, user.ID, string(user.Role))
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *AuthService) Me(ctx context.Context, userID string) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}
