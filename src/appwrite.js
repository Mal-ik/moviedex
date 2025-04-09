import { Client, Databases, Query, ID } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const database = new Databases(client); // functionality we want to use from the appwrite sdk

export const updateSearchCount = async (search, movie) => {
    // 1. Use Appwrite SDK to check if the search term already exists in the database

    try {
        const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('search', search),
        ]);

        // 2. If it does, update the count
        if (response.documents.length > 0) {
            // update the count
            const doc = response.documents[0];
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
                count: doc.count + 1,
            });
        } else {
        // 3. If it doesn't, create a new document with the search term and a count of 1
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                search,
                count: 1,
                movie_id: movie.id,
                poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
            });
        }
    } catch (error) {
        console.error('Error updating search count:', error);
    }
}

export const fetchTrendingMovies = async () => {
    try {
        const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.orderDesc('count'), Query.limit(5)]);
        console.log(response.documents);
        return response.documents;
    } catch (error) {
        console.error('Error getting trending movies:', error);
        return [];
    }
}