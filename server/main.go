package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type annotation struct {
	AnnotationId string  `json:"annotationId" bson:"annotationId"`
	LabelIndex   int     `json:"labelIndex" bson:"labelIndex"`
	Left         float32 `json:"left" bson:"left"`
	Top          float32 `json:"top" bson:"top"`
	Width        float32 `json:"width" bson:"width"`
	Height       float32 `json:"height" bson:"height"`
}

type imageEntry struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	ImageName   string             `json:"imageName" bson:"imageName"`
	ImageURL    string             `json:"imageURL" bson:"imageURL"`
	Annotations []annotation       `json:"annotations" bson:"annotations"`
}

var collection *mongo.Collection

// Create Image Entry
func createImageEntry(c *gin.Context) {
	var newImage imageEntry

	if err := c.BindJSON(&newImage); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, err := collection.InsertOne(context.TODO(), newImage)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert image entry"})
		return
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"id": result.InsertedID})
}

// Get All Images
func getImageEntries(c *gin.Context) {
	var images []imageEntry

	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image entries"})
		return
	}
	defer cursor.Close(context.TODO())

	if err := cursor.All(context.TODO(), &images); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode image entries"})
		return
	}

	c.IndentedJSON(http.StatusOK, images)
}

// Get annotation by image name
func getAnnotationsByImageName(c *gin.Context) {
	imageName := c.Param("imageName")
	var image imageEntry

	// Find the image entry by image name
	err := collection.FindOne(context.TODO(), bson.D{{Key: "imageName", Value: imageName}}).Decode(&image)
	if err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Failed to find image entry."})
		return
	}

	// Return only the annotations from the found image entry
	c.IndentedJSON(http.StatusOK, image.Annotations)
}

// Delete all image entries
func deleteImageEntries(c *gin.Context) {
	dr, err := collection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Error occurred trying to delete all."})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"deletedCount": dr.DeletedCount})
}

func addAnnotationToImage(c *gin.Context) {
	imageName, ok := c.GetQuery("imageName")
	if !ok {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "Missing imageName query parameter."})
		return
	}

	var newAnnotation annotation

	if err := c.BindJSON(&newAnnotation); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	filter := bson.D{{Key: "imageName", Value: imageName}}
	update := bson.D{{Key: "$push", Value: bson.D{{Key: "annotations", Value: newAnnotation}}}}

	result, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Printf("Failed to update annotations for image '%s': %v\n", imageName, err)
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to add annotation"})
		return
	}

	if result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Annotation added successfully"})
}

// func deleteAnnotation(c *gin.Context) {
// 	imageName := c.Param("imageName")
// 	annotationID := c.Param("annotationId")

// 	// Convert annotationID to ObjectID
// 	annotationObjectID, err := primitive.ObjectIDFromHex(annotationID)
// 	if err != nil {
// 		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid annotation ID"})
// 		return
// 	}

// 	// Find and update the image entry to remove the annotation
// 	filter := bson.D{{Key: "imageName", Value: imageName}}
// 	update := bson.D{
// 		{Key: "$pull", Value: bson.D{
// 			{Key: "annotations", Value: bson.D{{Key: "_id", Value: annotationObjectID}}},
// 		}},
// 	}

// 	result, err := collection.UpdateOne(context.TODO(), filter, update)
// 	if err != nil {
// 		log.Printf("Failed to delete annotation '%s' for image '%s': %v\n", annotationID, imageName, err)
// 		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete annotation"})
// 		return
// 	}

// 	if result.MatchedCount == 0 {
// 		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Image not found"})
// 		return
// 	}
// 	if result.ModifiedCount == 0 {
// 		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Annotation not found"})
// 		return
// 	}

// 	c.IndentedJSON(http.StatusOK, gin.H{"message": "Annotation deleted successfully"})
// }

func deleteAnnotationFromImage(c *gin.Context) {
	imageName := c.Param("imageName")
	annotationId := c.Param("annotationId")

	filter := bson.M{"imageName": imageName}
	update := bson.M{"$pull": bson.M{"annotations": bson.M{"annotationId": annotationId}}}

	result, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil || result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Image or annotation not found"})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": "Annotation deleted successfully"})
}

func main() {
	// Create a MongoDB client and connect
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal("Connection error:", err)
	}
	defer client.Disconnect(context.TODO())

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Ping error:", err)
	}

	fmt.Println("Successfully connected to MongoDB!")

	// Set the collection reference
	db := client.Database("annotationdb")
	collection = db.Collection("annotations")

	router := gin.Default()
	router.SetTrustedProxies(nil)

	// GET
	router.GET("/images", getImageEntries)
	router.GET("/images/:imageName/annotations", getAnnotationsByImageName)
	// POST
	router.POST("/images", createImageEntry)
	// PATCH
	router.PATCH("/annotations", addAnnotationToImage)
	// DELETE
	router.DELETE("/images", deleteImageEntries)
	router.DELETE("/images/:imageName/annotations/:annotationId", deleteAnnotationFromImage)

	router.Run("localhost:8080")
}
