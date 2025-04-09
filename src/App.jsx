import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import Search from './components/Search';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { updateSearchCount, fetchTrendingMovies } from './appwrite';

const API_BASE = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingImdbIds, setTrendingImdbIds] = useState({});

  // Featured movies for the hero section
  const featuredMovies = [
    { image: './godfather.webp' },
    { image: './interstellar.webp' },
    { image: './shawshank.webp' },
  ];

  // debounce the search input to prevent too many requests
  // by waiting 500ms after the user has stopped typing
  useDebounce(() => setDebouncedSearch(search), 500, [search]);

  // Generate IMDb link using the same logic as MovieCard component
  const getImdbLink = (imdbId, title, year) => {
    // If we have an IMDb ID, link directly to the movie page
    if (imdbId) {
      return `https://www.imdb.com/title/${imdbId}/`;
    }
    
    // Otherwise, search on IMDb using title and year
    const formattedTitle = title.replace(/\s+/g, '+');
    
    if (year) {
      return `https://www.imdb.com/find?q=${formattedTitle}+${year}`;
    } else {
      return `https://www.imdb.com/find?q=${formattedTitle}`;
    }
  };

  const fetchMovies = async (query) => {
    setIsLoading(true);
    try { // good to implement when fetching data
        const endpoint = query ? `${API_BASE}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE}/discover/movie?sort_by=popularity.desc`;
        const response = await fetch(endpoint, API_OPTIONS);
        
        if (!response.ok) {
          throw new Error("Could not find movies");
        }
        const data = await response.json();
        
        if (data.Response === "False") {
          setErrorMsg(data.Error || "An error occurred");
          setMovieList([]);
          return;
        }

        setMovieList(data.results || []);

        if (query && data.results.length > 0) {
          await updateSearchCount(query, data.results[0]);
        }

    } catch (error) {
      setErrorMsg(`Error fetching movies: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch IMDb IDs for trending movies
  const fetchTrendingImdbIds = async (movieId) => {
    try {
      const response = await fetch(
        `${API_BASE}/movie/${movieId}/external_ids`,
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
          setTrendingImdbIds(prev => ({
            ...prev,
            [movieId]: data.imdb_id
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching trending IMDb ID:", error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTrendingMovies().then(movies => {
      setTrendingMovies(movies);
      
      // Fetch IMDb IDs for each trending movie
      movies.forEach(movie => {
        if (movie.movie_id) {
          fetchTrendingImdbIds(movie.movie_id);
        }
      });
    });
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <div className="hero-cards">
            {featuredMovies.map((movie, index) => (
              <div key={index} className="hero-card">
                <img src={movie.image} alt="Featured Movie" />
                <div className="hero-card-overlay">
                </div>
              </div>
            ))}
          </div>
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            <span className="block text-gray-100 text-xl sm:text-2xl font-normal mt-2">Discover the perfect films for your movie night</span>
          </h1>
          <Search search={search} setSearch={setSearch} />
        </header>

        {trendingMovies.length > 4 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            
            <ul>
              {trendingMovies.map((movie, index) => ( 
                <li key={movie.$id}>
                  <a 
                    href={getImdbLink(
                      trendingImdbIds[movie.movie_id], 
                      movie.search, 
                      ''
                    )} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.search} />
                    <span>{movie.search}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          )}

        <section className="all-movies">
          <h2>
            {debouncedSearch ? `Search Results for "${debouncedSearch}"` : "Popular Movies"}
          </h2>
          
          {isLoading ? (
            <Spinner />
          ) : errorMsg ? (
            <p className="text-red-500 text-center py-8">{errorMsg}</p>
          ) : movieList.length === 0 ? (
            <p className="text-gray-100 text-center py-8">No movies found. Try a different search.</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  );
};

export default App;