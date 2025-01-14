import { Annotation, APIImage } from "./types";

export { getData, postData, postImage, patchAnnotation, deleteAnnotationFromImage }

// const BASE_URL = 'http://localhost:8080'; // Change this to your API's base URL
const BASE_URL = 'http://localhost:5173/api'; // Using a proxy

const getData = async (endpoint: string) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GET Request Failed:', error);
    throw error; // You can handle the error further or display a user-friendly message
  }
}

const postData = async (endpoint: string, body: string) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('POST Request Failed:', error);
    throw error; // You can handle the error further or display a user-friendly message
  }
}

const patchData = async (endpoint: string, query: string, body: string) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?${query}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PATCH Request Failed:', error);
    throw error; // You can handle the error further or display a user-friendly message
  }
}

const deleteData = async (endpoint: string) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('DELETE Request Failed:', error);
    throw error; // You can handle the error further or display a user-friendly message
  }
}

const postImage = (imageFile: APIImage) => {
  postData("/images", JSON.stringify(imageFile))
}

const patchAnnotation = (imageName: string, annotation: Annotation) => {
  patchData("/annotations", `imageName=${imageName}`, JSON.stringify(annotation))
}

const deleteAnnotationFromImage = (imageName: string, annotationId: string) => {
  deleteData(`/images/${encodeURIComponent(imageName)}/annotations/${encodeURIComponent(annotationId)}`)
}