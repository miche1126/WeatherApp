import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search"; // Material UI Search Icon
import DeleteIcon from "@mui/icons-material/Delete"; // Material UI Delete Icon
import "./App.css";
import cloudImg from "./assets/cloud.png"
import sunImg from "./assets/cloud.png"

const API_KEY = "935e4a27bd5b7f810b125a87cf5901af"; // API key
const API_URL = "https://api.openweathermap.org/data/2.5/forecast"; // API URL

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setHistory(storedHistory);
  }, []);

  // Fetch weather data from the API
  const fetchWeather = async (cityName) => {
    setError(null);
    setWeather(null);

    try {
      const response = await fetch(
        `${API_URL}?q=${cityName}&appid=${API_KEY}&units=metric`
      );

      const data = await response.json();
      if (data.cod === "200") {
        setWeather(data);
      } else {
        setError("City not found. Try again.");
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  // Handle search action
  const handleSearch = () => {
    if (city.trim() === "") return;

    // Check if the city is already in the history list
    const cityExists = history.find(item => item.city.toLowerCase() === city.toLowerCase());

    if (!cityExists) {
      // If the city is not in the history, add it
      const searchTime = new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'});
      const updatedHistory = [{ city, time: searchTime }, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    } else {
      // If the city already exists, just update the timestamp
      const updatedHistory = [
        { city: city, time: new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) }, ...history.filter((item) => item.city !== city),];
      setHistory(updatedHistory);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    }

    fetchWeather(city); // Call the API
  };

  // Handle click on a history item
  const handleHistoryClick = (searchedCity) => {
    setCity(searchedCity);
    fetchWeather(searchedCity);

    const timestamp = new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}); // Get current local time
    const updatedHistory = [
      { city: searchedCity, time: timestamp }, ...history.filter((item) => item.city !== searchedCity),];

    setHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  // Clear individual history item
  const clearHistoryItem = (index) => {
    const updatedHistory = history.filter((_, i) => i !== index);
    setHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  // Clear all search history
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // Get today's forecast (max & min temperatures)
  const getTodayForecast = () => {
    if (!weather) return null;
    const searchTime = new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}); //current time
    const today = new Date().getDate(); // today date
    const dailyForecast = weather.list.filter((entry) => new Date(entry.dt_txt).getDate() === today ); // filter today forecast from the list
    const maxTemp = Math.max(...dailyForecast.map((entry) => entry.main.temp_max)); //get highest temp of the day
    const minTemp = Math.min(...dailyForecast.map((entry) => entry.main.temp_min)); //get lowest temp of the day
    let weatherImg ="";
    if( dailyForecast[0].weather[0].id < 600){
      weatherImg = cloudImg;
    }else if ( dailyForecast[0].weather[0].id >= 800 ){
      weatherImg = sunImg;
    }
    return { searchTime, maxTemp, minTemp, currentTemp: dailyForecast[0].main.temp, humidity: dailyForecast[0].main.humidity, condition: dailyForecast[0].weather[0].description, image:weatherImg };
  };

  const todayWeather = getTodayForecast();

  return (
    <div className="container">

      {/* Search bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            id="search"
            placeholder=" " /* Important for floating label */
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <label htmlFor="search" className="search-label">Enter City</label>
        </div>
        <button className="search-btn" onClick={handleSearch}>
          <SearchIcon /> {/* Material UI Search Icon */}
        </button>
      </div>

       {/* Error Message */}
      {error && (<p className="error-message">{error}</p>)}
      
      <div className="result-container">
        
        {/* Weather Info */}
        {todayWeather && (
          <>
          <img src={todayWeather.image} alt="Weather Icon" className="weather-overlay" />
          <div className="weather-container">
            
            <div className="weather-temp">
                <p>Today's weather</p>
                <p className="currTemp">{Math.round(todayWeather.currentTemp)}°C</p>
                <p>H: {Math.round(todayWeather.maxTemp)}°C &nbsp; L: {Math.round(todayWeather.minTemp)}°C</p>
                <p className="city mobile-only">{weather.city.name}, {weather.city.country}</p>
            </div>  
            <div className="weather-info">
              <p className="city mobile-hide">{weather.city.name}, {weather.city.country}</p>
              <p>{todayWeather.searchTime}</p>
              <p>Humidity: {todayWeather.humidity}%</p>
              <p>{todayWeather.condition}</p>
            </div>
            
          </div>
          </>
        )}

        {/* Search History */}
        {history.length > 0 && (
          <div className="history-container">
            <h3>Search History</h3>
            <ul>
              {history.map((item, index) => (
                <li key={index}>
                  <div className="item-wrapper">
                    <span className="item-city">{item.city}</span>
                    <span className="item-time">{item.time}</span>
                  </div>
                  <button className="search-item" onClick={() => handleHistoryClick(item.city)}>
                    <SearchIcon /> {/* Material UI Refresh Icon */}
                  </button>
                  <button className="clear-item" onClick={() => clearHistoryItem(index)}>
                    <DeleteIcon /> {/* Material UI Delete Icon */}
                  </button>
                </li>
              ))}
            </ul>
            <button className="clear-all" onClick={clearAllHistory}>
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
