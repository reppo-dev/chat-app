package routes

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/middleware"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handleUpdateProfile(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5*time.Second)
	defer cancel()

	userIDAny,exists:= c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	userID,ok:= userIDAny.(int64)
	if !ok {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	var req struct{
		Name 		string `json:"name"`
		Bio			*string `json:"bio"`
		Birthdate 	*string `json:"birthdate"`
		PhoneNumber *string `json:"phone_number"`
	}

	if err :=c.ShouldBindJSON(&req); err!=nil{
		utils.JSON(c,http.StatusBadRequest,false,"Invalid Request body",nil)
		return
	}

	if req.Name == "" {
		utils.JSON(c,http.StatusBadRequest,false,"Name is required",nil)
		return
	}

	var bio, phone sql.NullString
	if req.Bio != nil {
		bio = sql.NullString{Valid: true,String: *req.Bio}
	}

	if req.PhoneNumber != nil {
		phone = sql.NullString{Valid: true,String: *req.PhoneNumber}
	}

	var birthdate sql.NullTime

	if req.Birthdate != nil && *req.Birthdate != "" {
		t,err := time.Parse("2006-01-02", *req.Birthdate)
		if err !=nil {
			utils.JSON(c,http.StatusBadRequest,false,"Invalid birthdate format (us YYYY-MM-DD)",nil)
			return
		}
		birthdate = sql.NullTime{Time: t,Valid: true}
	}

	user , err := server.queries.UpdateUser(ctx,db.UpdateUserParams{
		Name: req.Name,
		ID: userID,
		Bio: bio,
		Birthdate: birthdate,
		PhoneNumber: phone,
	})

	if err!=nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Profile update successfully",nil)
		return
	}

	utils.JSON(c,http.StatusOK,true,"Profile update successfully",gin.H{
		"user":user,
	})
}

func (server *Server) handleGetUserProfile(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userIDStr := c.Param("user_id")
	userID,err := strconv.ParseInt(userIDStr,10,64)
	if err != nil {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid user ID",nil)
		return
	}

	user,err := server.queries.GetUserByID(ctx,userID)
	if err!=nil {
		if errors.Is(err,sql.ErrNoRows) {
		utils.JSON(c,http.StatusBadRequest,false,"User not found",nil)
		return
		}
		utils.JSON(c,http.StatusInternalServerError,false,"failed to fetch user",nil)
		return
	}

	utils.JSON(c,http.StatusOK,true,"User profile fetched",gin.H{
		"user":user,
	})
}

