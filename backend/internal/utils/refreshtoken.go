package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
)

func GenerateRefreshToken() (string,error) {
	b := make([]byte,32)

	_,err:= rand.Read(b)

	if err!=nil {
		return "",err
	}

	return base64.URLEncoding.EncodeToString(b),nil
}


func HashRefreshToken(token string) string {
	hash:= sha256.Sum256([]byte(token))

	return base64.RawURLEncoding.EncodeToString(hash[:])
}