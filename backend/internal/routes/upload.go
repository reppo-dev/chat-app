package routes

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/utils"
)

const uploadDir = "./uploads"
const maxFileSize = 50 * 1024 * 1024 // 50MB

var allowedExtensions = map[string]bool{
	// Images
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".svg":  true,
	// Videos
	".mp4":  true,
	".webm": true,
	".mov":  true,
	".ogg":  true,
	// Audio
	".mp3":  true,
	".wav":  true,
	// Documents
	".pdf":  true,
}

func ensureUploadDir() error {
	return os.MkdirAll(uploadDir, 0755)
}

func generateFileName(originalName string) string {
	ext := strings.ToLower(filepath.Ext(originalName))
	bytes := make([]byte, 8)
	rand.Read(bytes)
	randomHex := hex.EncodeToString(bytes)
	return fmt.Sprintf("%d_%s%s", time.Now().UnixMilli(), randomHex, ext)
}

func (server *Server) handleUploadFile(c *gin.Context) {
	if err := ensureUploadDir(); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to initialize upload directory", nil)
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "No file provided", nil)
		return
	}

	if file.Size > maxFileSize {
		utils.JSON(c, http.StatusBadRequest, false, "File exceeds maximum size of 50MB", nil)
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		utils.JSON(c, http.StatusBadRequest, false, "File extension not permitted", nil)
		return
	}

	fileName := generateFileName(file.Filename)
	destination := filepath.Join(uploadDir, fileName)

	if err := c.SaveUploadedFile(file, destination); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to save file", nil)
		return
	}

	fileURL := "/uploads/" + fileName

	utils.JSON(c, http.StatusOK, true, "File uploaded successfully", gin.H{
		"url":           fileURL,
		"filename":      fileName,
		"original_name": file.Filename,
		"size":          file.Size,
		"extension":     ext,
	})
}

func (server *Server) handleUploadMultipleFiles(c *gin.Context) {
	if err := ensureUploadDir(); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to initialize upload directory", nil)
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid multipart form", nil)
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}

	if len(files) == 0 {
		utils.JSON(c, http.StatusBadRequest, false, "No files provided", nil)
		return
	}

	type UploadResult struct {
		URL          string `json:"url"`
		Filename     string `json:"filename"`
		OriginalName string `json:"original_name"`
		Size         int64  `json:"size"`
		Extension    string `json:"extension"`
	}

	var results []UploadResult

	for _, file := range files {
		if file.Size > maxFileSize {
			continue
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		if !allowedExtensions[ext] {
			continue
		}

		fileName := generateFileName(file.Filename)
		destination := filepath.Join(uploadDir, fileName)

		if err := c.SaveUploadedFile(file, destination); err == nil {
			results = append(results, UploadResult{
				URL:          "/uploads/" + fileName,
				Filename:     fileName,
				OriginalName: file.Filename,
				Size:         file.Size,
				Extension:    ext,
			})
		}
	}

	utils.JSON(c, http.StatusOK, true, "Files processed", gin.H{
		"files": results,
	})
}
