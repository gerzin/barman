package postgres

import (
	"context"

	"barman/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserPostgresRepository struct {
	db *pgxpool.Pool
}

func NewUserPostgresRepository(db *pgxpool.Pool) *UserPostgresRepository {

	return &UserPostgresRepository{
		db: db,
	}
}

func (r *UserPostgresRepository) Create(ctx context.Context, user *domain.User) error {
	query := `INSERT INTO users (email, name, surname, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err := r.db.QueryRow(ctx, query, user.Email, user.Name, user.Surname, user.Phone, user.PasswordHash, user.Role).Scan(&user.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserPostgresRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	query := `SELECT id, email, name, surname, phone, password_hash, role, created_at, updated_at FROM users WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var user domain.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.Surname, &user.Phone, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserPostgresRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, name, surname, phone, password_hash, role, created_at, updated_at FROM users WHERE email = $1`
	row := r.db.QueryRow(ctx, query, email)

	var user domain.User
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.Surname, &user.Phone, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserPostgresRepository) Update(ctx context.Context, user *domain.User) error {
	query := `UPDATE users SET email = $1, name = $2, surname = $3, phone = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`
	_, err := r.db.Exec(ctx, query, user.Email, user.Name, user.Surname, user.Phone, user.Role, user.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserPostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserPostgresRepository) List(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := `SELECT id, email, name, surname, phone, password_hash, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*domain.User, 0)
	for rows.Next() {
		var user domain.User
		err := rows.Scan(&user.ID, &user.Email, &user.Name, &user.Surname, &user.Phone, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
