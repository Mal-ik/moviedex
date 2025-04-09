import React, { useState, useEffect } from 'react';
// presentational component - accepts props and returns a JSX element
const MovieCard = ({ movie: { id, title, poster_path, release_date, vote_average, original_language } }) => {
    const [imdbId, setImdbId] = useState(null);
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    
    useEffect(() => {
        // Try to fetch the movie's external IDs from TMDB to get IMDb ID
        const fetchImdbId = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${id}/external_ids`, 
                    {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: `Bearer ${API_KEY}`,
                        },
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.imdb_id) {
                        setImdbId(data.imdb_id);
                    }
                }
            } catch (error) {
                console.error("Error fetching IMDb ID:", error);
            }
        };
        
        fetchImdbId();
    }, [id, API_KEY]);

    const getImdbLink = () => {
        // If we have an IMDb ID, link directly to the movie page
        if (imdbId) {
            return `https://www.imdb.com/title/${imdbId}/`;
        }
        
        // Otherwise, search on IMDb using title and year
        const formattedTitle = title.replace(/\s+/g, '+');
        const year = release_date ? release_date.slice(0, 4) : '';
        
        if (year) {
            return `https://www.imdb.com/find?q=${formattedTitle}+${year}`;
        } else {
            return `https://www.imdb.com/find?q=${formattedTitle}`;
        }
    };

    return (
        <a 
            href={getImdbLink()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="movie-card block cursor-pointer"
        >
            <img src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : "/no-movie-2x.png"} alt={title} />

            <div className="mt-4">
                <h3>{title}</h3>

                <div className="content">
                    <div className="rating">
                        <img src="star.svg" alt="Star Icon" />
                        <p className="rating">{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
                    </div>

                    <span>•</span>
                    <p className="lang">{original_language ? original_language.toUpperCase() : "N/A"}</p>
                    
                    <span>•</span>
                    <p className="year">{release_date ? release_date.slice(0, 4) : "N/A"}</p>
                </div>
            </div>
        </a>
    )
}

export default MovieCard;