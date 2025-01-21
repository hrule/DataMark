import { Annotation, APIImage, APIImageEntry, APILabel } from "./types";

export { getData, postData, postImage, postAnnotationToImage, deleteAnnotationFromImage, getImagesPaginated, getAnnotationsByImageName, getAllData, deleteAllData, postLabel, getLabels }

const BASE_URL = 'http://localhost:5173/api'; // Using a proxy

const getData = async <T>(endpoint: string): Promise<T> => {
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

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('GET Request Failed:', error);
    throw error; 
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
    throw error;
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
    throw error;
  }
}

const postImage = (imageFile: APIImage) => {
  postData("/images", JSON.stringify(imageFile))
}

const postAnnotationToImage = (imageName: string, annotation: Annotation) => {
  postData(`/images/${imageName}/annotations`, JSON.stringify(annotation))
}

const deleteAnnotationFromImage = (imageName: string, annotationId: string) => {
  deleteData(`/images/${encodeURIComponent(imageName)}/annotations/${encodeURIComponent(annotationId)}`)
}

const getImagesPaginated = async (page: number) => {
  const endpoint = `/images/paginated?page=${page}`;
  return await getData<APIImageEntry[]>(endpoint); 
};

const getAnnotationsByImageName = async (imageName: string) => {
  const endpoint = `/images/${imageName}/annotations`
  return await getData<Annotation[]>(endpoint)
}

const getAllData = async () => {
  return await getData<APIImageEntry[]>("/images")
}

const deleteAllData = () => {
  deleteData("/images")
  deleteData("/labels")
}

const postLabel = (labelName: string) => {
  postData("/labels", JSON.stringify({labelName: labelName}))
}

const getLabels = async () => {
  return await getData<APILabel[]>("/labels")
}