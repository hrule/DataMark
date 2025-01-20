// package main

// import (
// 	"net/http"
// 	"net/http/httptest"
// 	"testing"

// 	"github.com/gin-gonic/gin"
// 	"github.com/stretchr/testify/assert"
// )

// func TestGetImages(t *testing.T) {
// 	// Create a Gin router
// 	router := gin.Default()

// 	// Define a simple handler for /images
// 	router.GET("/images", func(c *gin.Context) {
// 		c.JSON(http.StatusOK, gin.H{"message": "Success"})
// 	})

// 	// Create a new HTTP request
// 	req, _ := http.NewRequest("GET", "/images", nil)

// 	// Record the response
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	// Assert the response status code
// 	assert.Equal(t, http.StatusOK, w.Code)

//		// Assert the response body
//		assert.JSONEq(t, `{"message": "Success"}`, w.Body.String())
//	}
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

var testRouter *gin.Engine

func setupRouter() *gin.Engine {
	// Initialize the router and set it up for testing
	router := gin.Default()

	// Set up routes
	router.GET("/images", GetImages)
	router.GET("/images/paginated", GetImagesPaginated)
	router.GET("/images/:imageName/annotations", GetAnnotationsByImageName)
	router.POST("/images", CreateImage)
	router.POST("/images/:imageName/annotations", AddAnnotationToImage)
	router.DELETE("/images", DeleteAllImages)
	router.DELETE("/images/:imageName/annotations/:annotationId", DeleteAnnotationFromImage)

	return router
}

func TestCreateImage(t *testing.T) {
	// Setup test environment
	testRouter = setupRouter()

	// Create a new image to test
	newImage := Image{
		ImageName: "test_image",
		ImageURL:  "http://test.com/test_image.jpg",
	}

	// Convert the image struct to JSON
	body, err := json.Marshal(newImage)
	if err != nil {
		t.Fatal("Could not marshal image:", err)
	}

	// Create a new POST request
	req, err := http.NewRequest("POST", "/images", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal("Could not create request:", err)
	}

	// Record the response
	rr := httptest.NewRecorder()
	testRouter.ServeHTTP(rr, req)

	// Check if the response status code is what we expect
	assert.Equal(t, http.StatusCreated, rr.Code, "Expected status code to be 201")

	// Decode the response to get the inserted ID
	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatal("Could not unmarshal response:", err)
	}

	// Check if the ID is returned
	assert.NotNil(t, response["id"], "Expected an id to be returned")
}
