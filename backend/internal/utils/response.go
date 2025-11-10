package utils

import "github.com/gin-gonic/gin"

// Response represents standard API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse returns success response
func SuccessResponse(message string, data interface{}) gin.H {
	return gin.H{
		"success": true,
		"message": message,
		"data":    data,
	}
}

// ErrorResponse returns error response
func ErrorResponse(message string) gin.H {
	return gin.H{
		"success": false,
		"error":   message,
	}
}

// PaginatedResponse represents paginated response
type PaginatedResponse struct {
	Success bool           `json:"success"`
	Data    interface{}    `json:"data"`
	Meta    PaginationMeta `json:"meta"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalItems int64 `json:"total_items"`
	TotalPages int   `json:"total_pages"`
}

// PaginatedSuccessResponse returns paginated response
func PaginatedSuccessResponse(message string, data interface{}, page, limit int, totalItems int64) gin.H {
	totalPages := int(totalItems) / limit
	if int(totalItems)%limit != 0 {
		totalPages++
	}

	return gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"meta": gin.H{
			"page":        page,
			"limit":       limit,
			"total_items": totalItems,
			"total_pages": totalPages,
		},
	}
}
