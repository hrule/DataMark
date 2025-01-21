package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var testCollection *mongo.Collection

func setupIntegrationTest() *gin.Engine {
	gin.SetMode(gin.TestMode)

	// Initialize real MongoDB connection
	clientOptions := options.Client().ApplyURI(getMongoURI())
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		panic("Failed to connect to MongoDB for tests: " + err.Error())
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		panic("Failed to ping MongoDB for tests: " + err.Error())
	}

	// Use a test-specific database
	testDB := client.Database("annotationdb_test")
	testCollection = testDB.Collection("annotations_test")
	ImageCollection = testCollection

	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.GET("/images", GetImages)
	router.GET("/images/paginated", GetImagesPaginated)
	router.GET("/images/:imageName/annotations", GetAnnotationsByImageName)
	// POST
	router.POST("/images", CreateImage)
	router.POST("/images/:imageName/annotations", AddAnnotationToImage)
	// DELETE
	router.DELETE("/images", DeleteAllImages)
	router.DELETE("/images/:imageName/annotations/:annotationId", DeleteAnnotationFromImage)
	return router
}

func teardownIntegrationTest() {
	testCollection.Drop(context.TODO()) // Clean up data after tests
}

func TestCreateImageIntegration(t *testing.T) {
	router := setupIntegrationTest() // Set up router with real DB
	defer teardownIntegrationTest()  // Clean up after

	// Create an image entry
	imageJSON := `{"imageName":"test_image.jpg","imageURL":"http://example.com/test_image.jpg","annotations":[]}`
	req, _ := http.NewRequest("POST", "/images", strings.NewReader(imageJSON))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req) // Simulate request

	assert.Equal(t, http.StatusCreated, rr.Code, "Expected status code 201 for successful creation")
}

func TestGetImagesIntegration(t *testing.T) {
	router := setupIntegrationTest()
	defer teardownIntegrationTest()

	testCollection.InsertOne(context.TODO(), bson.M{
		"imageName":   "test_image.jpg",
		"imageURL":    "http://example.com/test_image.jpg",
		"annotations": []interface{}{},
	})

	req, _ := http.NewRequest("GET", "/images", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 for retrieving images")
	assert.Contains(t, rr.Body.String(), "test_image.jpg", "Expected to find image name in response")
}

func TestGetAnnotationsByImageNameIntegration(t *testing.T) {
	router := setupIntegrationTest()
	defer teardownIntegrationTest()

	// Insert a test image with annotations
	testCollection.InsertOne(context.TODO(), bson.M{
		"imageName": "annotated_image.jpg",
		"imageURL":  "http://example.com/annotated_image.jpg",
		"annotations": []bson.M{
			{"annotationId": "1", "labelIndex": 0, "left": 10.0, "top": 20.0, "width": 50.0, "height": 60.0},
		},
	})

	req, _ := http.NewRequest("GET", "/images/annotated_image.jpg/annotations", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 for retrieving annotations")
	assert.Contains(t, rr.Body.String(), `"annotationId": "1"`, "Expected to find annotationId in response")
}

func TestDeleteAllImagesIntegration(t *testing.T) {
	router := setupIntegrationTest()
	defer teardownIntegrationTest()

	// Insert test images
	testCollection.InsertOne(context.TODO(), bson.M{"imageName": "delete_image.jpg"})
	testCollection.InsertOne(context.TODO(), bson.M{"imageName": "another_delete_image.jpg"})

	req, _ := http.NewRequest("DELETE", "/images", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 for deleting all images")

	count, err := testCollection.CountDocuments(context.TODO(), bson.M{})
	assert.NoError(t, err, "Expected no error while counting documents")
	assert.Equal(t, int64(0), count, "Expected no documents after deletion")
}

func TestAddAnnotationToImageIntegration(t *testing.T) {
	router := setupIntegrationTest()
	defer teardownIntegrationTest()

	// Insert a test image
	testCollection.InsertOne(context.TODO(), bson.M{
		"imageName":   "image_for_annotation.jpg",
		"annotations": []bson.M{},
	})

	annotationJSON := `{"annotationId":"2","labelIndex":1,"left":15.0,"top":25.0,"width":55.0,"height":65.0}`
	req, _ := http.NewRequest("POST", "/images/image_for_annotation.jpg/annotations", strings.NewReader(annotationJSON))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 for adding annotation")
	assert.Contains(t, rr.Body.String(), "Annotation added successfully", "Expected success message in response")
}

func TestDeleteAnnotationFromImageIntegration(t *testing.T) {
	router := setupIntegrationTest()
	defer teardownIntegrationTest()

	// Insert a test image with annotations
	testCollection.InsertOne(context.TODO(), bson.M{
		"imageName": "image_with_annotation.jpg",
		"annotations": []bson.M{
			{"annotationId": "3", "labelIndex": 2, "left": 30.0, "top": 40.0, "width": 70.0, "height": 80.0},
		},
	})

	req, _ := http.NewRequest("DELETE", "/images/image_with_annotation.jpg/annotations/3", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 for deleting annotation")
	assert.Contains(t, rr.Body.String(), "Annotation deleted successfully", "Expected success message in response")
}
