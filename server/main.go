package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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
	FilePath    string             `json:"filePath" bson:"filePath"`
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

const uploadDir = "uploads/"

// ============================== Image Handlers ==============================
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

// ============================== Label Handlers ==============================
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

// ============================== Image File Handlers ==============================
func UploadImageFile(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get file"})
		return
	}

	// Check if image exists
	var existingImage Image
	err = ImageCollection.FindOne(context.TODO(), bson.M{"imageName": file.Filename}).Decode(&existingImage)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "An image with this name already exists"})
		return
	}

	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
		return
	}

	// Save the files
	filePath := filepath.Join(uploadDir, file.Filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Wait until the file is fully saved and accessible
	// maxRetries := 10
	// for i := 0; i < maxRetries; i++ {
	// 	if _, err := os.Open(filePath); err == nil {
	// 		break
	// 	}
	// 	time.Sleep(100 * time.Millisecond) // Small delay before retrying
	// }

	// Ensure the file actually exists before proceeding
	// Countermeasure against images not being available before serving.
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File was not properly saved"})
		return
	}

	// Insert metadata into MongoDB
	newImage := Image{
		ID:          primitive.NewObjectID(),
		ImageName:   file.Filename,
		ImageURL:    "",
		FilePath:    filePath,
		Annotations: []Annotation{},
	}
	_, err = ImageCollection.InsertOne(context.TODO(), newImage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image uploaded successfully", "filePath": filePath})
}

func ServeImageFile(c *gin.Context) {
	imageName := c.Param("imageName")
	var image Image

	err := ImageCollection.FindOne(context.TODO(), bson.M{"imageName": imageName}).Decode(&image)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.File(image.FilePath)
}

func DeleteAllImageFiles(c *gin.Context) {
	err := filepath.Walk(uploadDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			return os.Remove(path)
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image files"})
		return
	}

	// Remove all image metadata from MongoDB
	_, err = ImageCollection.DeleteMany(context.TODO(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All images deleted successfully"})
}

func getMongoURI() string {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		return "mongodb://localhost:27017"
	}
	return uri
}

func main() {
	err := godotenv.Load("server/.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// Env variables
	mongoURI := os.Getenv("MONGO_URI")
	dbName := os.Getenv("DATABASE_NAME")
	annotationsCollectionName := os.Getenv("ANNOTATIONS_COLLECTION_NAME")
	labelsCollectionName := os.Getenv("LABELS_COLLECTION_NAME")
	serverURL := os.Getenv("SERVER_URL")

	clientOptions := options.Client().ApplyURI(mongoURI)
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

	db := client.Database(dbName)
	ImageCollection = db.Collection(annotationsCollectionName)
	LabelCollection = db.Collection(labelsCollectionName)

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

	// ========== Image File Endpoints
	router.POST("/upload", UploadImageFile)
	router.GET("/uploads/:imageName", ServeImageFile)
	router.DELETE("/uploads", DeleteAllImageFiles)

	router.Run(serverURL)
}
