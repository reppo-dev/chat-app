package routes

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handelEmailRegister(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	var req struct{
		Name string `json:"name"`
		Email string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil{
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request body",nil)
		return
	}

	if req.Name == ""|| req.Email == "" || req.Password =="" {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid creditnal",nil)
		return
	}

	_,err := server.queries.GetUserByEmail(ctx,req.Email)
	if err == nil {
		utils.JSON(c,http.StatusConflict,false,"User already exists",nil)
		return
	}

	if !errors.Is(err,sql.ErrNoRows) {
		utils.JSON(c,http.StatusInternalServerError,false,"Sign up failed",nil)
		return
	}

	hashPassword , err := utils.HashPassword(req.Password)
	if err != nil {
   		utils.JSON(c,http.StatusInternalServerError,false,"Sign up failed please try again later",nil)
    	return
	}

	arg := db.CreateUserParams{
		Name: req.Name,
		Email: req.Email,
		PasswordHash: hashPassword,
	}

	user , err := server.queries.CreateUser(ctx,arg)
	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Sign up failed please try again later",nil)
		return
	}
	
	accessToken,err := utils.GenerateJWT(user.ID,user.Name)
	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"user created try login",nil)
		return
	}

	refreshToken,err := utils.GenerateRefreshToken()

	if err!= nil {
		utils.JSON(c,http.StatusInternalServerError,false,"failed to generate refresh token",nil)
		return
	}

	tokenHash := utils.HashRefreshToken(refreshToken)

	refreshTokenArg  := db.CreateRefreshTokenParams{
		UserID: user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(720 * time.Hour),
	}

	_,err = server.queries.CreateRefreshToken(ctx,refreshTokenArg)
	if err!=nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to create session",nil)
		return
	}

	http.SetCookie(c.Writer,&http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		HttpOnly: true,
		Secure: true,
		Path: "/",
		SameSite: http.SameSiteLaxMode,
	})

	utils.JSON(c,http.StatusCreated,true,"SignUp successfully",accessToken)
}


func (server *Server) handelEmailLogin(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5*time.Second)
	defer cancel()

	var req struct{
		Email string `json:"email"`
		Password string `json:"password"`
	}

	if err:= c.ShouldBindJSON(&req); err!=nil{
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request body",nil)
		return
	}

	if req.Email == "" || req.Password =="" {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid creditinal",nil)
		return
	}

	user,err := server.queries.GetUserByEmail(ctx,req.Email)
	if err != nil {
    	if errors.Is(err, sql.ErrNoRows) {
       		utils.JSON(c, http.StatusUnauthorized, false, "Invalid email or password", nil)
        	return
    	}
    	utils.JSON(c, http.StatusInternalServerError, false, "Login failed", nil)
   		return
	}

	err = utils.CheckPasswordHash(user.PasswordHash,req.Password)

	if err!= nil {
		utils.JSON(c, http.StatusUnauthorized, false, "Invalid email or password", nil)
		return
	}

	err = server.queries.DeleteAllUserRefreshTokens(ctx, user.ID)
	if err != nil {
    	utils.JSON(c, http.StatusInternalServerError, false, "Failed to clear previous sessions", nil)
    	return
	}

	accessToken,err := utils.GenerateJWT(user.ID,user.Name)
	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"failed login try again later",nil)
		return
	}

	refreshToken,err := utils.GenerateRefreshToken()
	
	if err!= nil {
		utils.JSON(c,http.StatusInternalServerError,false,"failed to generate refresh token",nil)
		return
	}

	hashRefreshToken := utils.HashRefreshToken(refreshToken)

	refreshTokenArg:= db.CreateRefreshTokenParams{
		UserID: user.ID,
		TokenHash: hashRefreshToken,
		ExpiresAt: time.Now().Add(720 * time.Hour),
	}

	_, err = server.queries.CreateRefreshToken(ctx,refreshTokenArg)

	if err!=nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to create session",nil)
		return
	}

	http.SetCookie(c.Writer,&http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		HttpOnly: true,
		Secure: true,
		Path: "/",
		SameSite: http.SameSiteLaxMode,
	})

	utils.JSON(c,http.StatusOK,true,"Login successfully",accessToken)
}


func (server *Server) handelLogout(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5*time.Second)
	defer cancel()

	

}