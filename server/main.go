package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
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

type image struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	ImageName   string             `json:"imageName" bson:"imageName"`
	ImageURL    string             `json:"imageURL" bson:"imageURL"`
	Annotations []annotation       `json:"annotations" bson:"annotations"`
}

var collection *mongo.Collection

func createImage(c *gin.Context) {
	var newImage image

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

func getImages(c *gin.Context) {
	var images []image

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

func getImagesPaginated(c *gin.Context) {
	var images []image
	pageStr := c.DefaultQuery("page", "0")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid page number"})
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid limit number"})
		return
	}

	skip := page * limit

	// Find with limit and skip for pagination
	options := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit))
	cursor, err := collection.Find(context.TODO(), bson.M{}, options)
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

func getAnnotationsByImageName(c *gin.Context) {
	imageName := c.Param("imageName")
	var image image

	err := collection.FindOne(context.TODO(), bson.D{{Key: "imageName", Value: imageName}}).Decode(&image)
	if err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Failed to find image entry."})
		return
	}

	c.IndentedJSON(http.StatusOK, image.Annotations)
}

func deleteAllImages(c *gin.Context) {
	dr, err := collection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Error occurred trying to delete all."})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"deletedCount": dr.DeletedCount})
}

// func addAnnotationToImage(c *gin.Context) {
// 	imageName, ok := c.GetQuery("imageName")
// 	if !ok {
// 		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "Missing imageName query parameter."})
// 		return
// 	}

// 	var newAnnotation annotation

// 	if err := c.BindJSON(&newAnnotation); err != nil {
// 		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
// 		return
// 	}

// 	filter := bson.D{{Key: "imageName", Value: imageName}}
// 	update := bson.D{{Key: "$push", Value: bson.D{{Key: "annotations", Value: newAnnotation}}}}

// 	result, err := collection.UpdateOne(context.TODO(), filter, update)
// 	if err != nil {
// 		log.Printf("Failed to update annotations for image '%s': %v\n", imageName, err)
// 		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to add annotation"})
// 		return
// 	}

// 	if result.MatchedCount == 0 {
// 		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Image not found"})
// 		return
// 	}

// 	c.IndentedJSON(http.StatusOK, gin.H{"message": "Annotation added successfully"})
// }

func addAnnotationToImage(c *gin.Context) {
	imageName := c.Param("imageName")
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

	db := client.Database("annotationdb")
	collection = db.Collection("annotations")

	router := gin.Default()
	router.SetTrustedProxies(nil)

	// GET
	router.GET("/images", getImages)
	router.GET("/images/paginated", getImagesPaginated)
	router.GET("/images/:imageName/annotations", getAnnotationsByImageName)
	// POST
	router.POST("/images", createImage)
	router.POST("/images/:imageName/annotations", addAnnotationToImage)
	// DELETE
	router.DELETE("/images", deleteAllImages)
	router.DELETE("/images/:imageName/annotations/:annotationId", deleteAnnotationFromImage)

	router.Run("localhost:8080")
}
