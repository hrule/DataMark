package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Annotation struct {
	AnnotationId string  `json:"annotationId" bson:"annotationId"`
	LabelIndex   int     `json:"labelIndex" bson:"labelIndex"`
	Left         float32 `json:"left" bson:"left"`
	Top          float32 `json:"top" bson:"top"`
	Width        float32 `json:"width" bson:"width"`
	Height       float32 `json:"height" bson:"height"`
}

type Image struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	ImageName   string             `json:"imageName" bson:"imageName"`
	ImageURL    string             `json:"imageURL" bson:"imageURL"`
	Annotations []Annotation       `json:"annotations" bson:"annotations"`
}

type Label struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	LabelName string             `json:"labelName" bson:"labelName"`
}

// var Collection *mongo.Collection
var (
	ImageCollection *mongo.Collection
	LabelCollection *mongo.Collection
)

// Image Handlers
func CreateImage(c *gin.Context) {
	var newImage Image

	if err := c.BindJSON(&newImage); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, err := ImageCollection.InsertOne(context.TODO(), newImage)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert image entry"})
		return
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"id": result.InsertedID})
}

func GetImages(c *gin.Context) {
	var images []Image

	cursor, err := ImageCollection.Find(context.TODO(), bson.M{})
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

func GetImagesPaginated(c *gin.Context) {
	var images []Image
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
	cursor, err := ImageCollection.Find(context.TODO(), bson.M{}, options)
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

func GetAnnotationsByImageName(c *gin.Context) {
	imageName := c.Param("imageName")
	var image Image

	err := ImageCollection.FindOne(context.TODO(), bson.D{{Key: "imageName", Value: imageName}}).Decode(&image)
	if err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Failed to find image entry."})
		return
	}

	c.IndentedJSON(http.StatusOK, image.Annotations)
}

func DeleteAllImages(c *gin.Context) {
	dr, err := ImageCollection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Error occurred trying to delete all."})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"deletedCount": dr.DeletedCount})
}

func AddAnnotationToImage(c *gin.Context) {
	imageName := c.Param("imageName")
	var newAnnotation Annotation

	if err := c.BindJSON(&newAnnotation); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	filter := bson.D{{Key: "imageName", Value: imageName}}
	update := bson.D{{Key: "$push", Value: bson.D{{Key: "annotations", Value: newAnnotation}}}}

	result, err := ImageCollection.UpdateOne(context.TODO(), filter, update)
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

func DeleteAnnotationFromImage(c *gin.Context) {
	imageName := c.Param("imageName")
	annotationId := c.Param("annotationId")

	filter := bson.M{"imageName": imageName}
	update := bson.M{"$pull": bson.M{"annotations": bson.M{"annotationId": annotationId}}}

	result, err := ImageCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil || result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Image or annotation not found"})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": "Annotation deleted successfully"})
}

// Label Handlers
func CreateLabel(c *gin.Context) {
	var newLabel Label

	if err := c.BindJSON(&newLabel); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, err := LabelCollection.InsertOne(context.TODO(), newLabel)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert label entry"})
		return
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"id": result.InsertedID})
}

func GetLabels(c *gin.Context) {
	var labels []Label

	cursor, err := LabelCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch labels"})
		return
	}
	defer cursor.Close(context.TODO())

	if err := cursor.All(context.TODO(), &labels); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode label entries"})
		return
	}

	c.IndentedJSON(http.StatusOK, labels)
}

func DeleteAllLabels(c *gin.Context) {
	dr, err := LabelCollection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Error occurred trying to delete all."})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"deletedCount": dr.DeletedCount})
}

func DeleteLabel(c *gin.Context) {
	labelName := c.Param("name")

	result, err := LabelCollection.DeleteOne(context.TODO(), bson.M{"name": labelName})
	if err != nil || result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Label not found"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Label deleted successfully"})
}

func getMongoURI() string {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		return "mongodb://localhost:27017" // Default for development
	}
	return uri
}

func main() {
	// clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")

	// err := godotenv.Load()
	// if err != nil {
	// 	log.Fatal("Error loading .env file")
	// }
	// mongoURI := os.Getenv("MONGO_URI")
	// dbName := os.Getenv("DATABASE_NAME")
	// collectionName := os.Getenv("COLLECTION_NAME")

	clientOptions := options.Client().ApplyURI(getMongoURI())
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
	ImageCollection = db.Collection("annotations")
	LabelCollection = db.Collection("labels")

	router := gin.Default()
	router.SetTrustedProxies(nil)

	// ========= Image Endpoints
	// GET
	router.GET("/images", GetImages)
	router.GET("/images/paginated", GetImagesPaginated)
	router.GET("/images/:imageName/annotations", GetAnnotationsByImageName)
	// POST
	router.POST("/images", CreateImage)
	router.POST("/images/:imageName/annotations", AddAnnotationToImage)
	// DELETE
	router.DELETE("/images", DeleteAllImages)
	router.DELETE("/images/:imageName/annotations/:annotationId", DeleteAnnotationFromImage)

	// ========== Label Endpoints
	router.GET("/labels", GetLabels)
	router.POST("/labels", CreateLabel)
	router.DELETE("/labels", DeleteAllLabels)
	router.DELETE("/labels/:name", DeleteLabel)

	router.Run("localhost:8080")
}
