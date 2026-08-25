package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtkey []byte

func InitJWT(key string) {
	jwtkey = []byte(key)
}

type CustomeClaims struct {
	UserID int64   `json:"user_id"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

func GenerateJWT(userId int64,name string) (string,error) {
	if len(jwtkey) == 0{
		return "",errors.New("kwt key not initialized")
	}

	claim := CustomeClaims{
		UserID: userId,
		Name: name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: fmt.Sprint(userId),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,claim)

	return token.SignedString(jwtkey)
}

