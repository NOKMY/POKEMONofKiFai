import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import pokemonLogo from './assets/POKEMONLOGO.png';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState([]);
  const [pokemonDetails, setPokemonDetails] = useState({});
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [allTypes, setAllTypes] = useState(['all']);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allPokemonNames, setAllPokemonNames] = useState([]);
  const [filteredPokemonNames, setFilteredPokemonNames] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [isBattleResultsVisible, setIsBattleResultsVisible] = useState(false);
  const [battleResults, setBattleResults] = useState([]);


  const typeColors = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6AEDB7',
    steel: '#B7B7CE',
    dark: '#705746',
    fairy: '#D685AD',
  };
  const POKEMON_PER_PAGE = 50;


  const fetchPokemonDetails = useCallback(async (name) => {
    if (pokemonDetails[name]) {
      return pokemonDetails[name];
    }
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const spriteUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
      const details = {
        id: data.id,
        name: data.name,
        types: data.types.map((t) => t.type.name),
        spriteUrl: spriteUrl,
        stats: data.stats.map((s) => ({ name: s.stat.name, base_stat: s.base_stat })),
        abilities: data.abilities.map((a) => a.ability.name),
      };
      setPokemonDetails((prevDetails) => ({ ...prevDetails, [name]: details }));
      return details;
    } catch (error) {
      console.error("Error fetching Pokémon details:", error);
      return null;
    }
  }, [pokemonDetails]);

  const fetchAllPokemonNames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1292`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const names = data.results.map((pokemon) => pokemon.name);
      setAllPokemonNames(names);
      setFilteredPokemonNames(names);
      setTotalPages(Math.ceil(names.length / POKEMON_PER_PAGE));
    } catch (error) {
      console.error("Error fetching all Pokémon names:", error);
      setError("Failed to load Pokémon list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/type`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const typeNames = data.results.map((type) => type.name).filter(name => name !== 'unknown' && name !== 'shadow');
      setAllTypes(['all', ...typeNames]);
    } catch (error) {
      console.error("Error fetching types:", error);
      setError("Failed to load Pokémon types.");
    } finally {
      setLoading(false);
    }
  }, []);


  const generateRandomEnemyTeam = useCallback(async () => {
    if (allPokemonNames.length < 6) {
      alert("Not enough Pokémon names to generate an enemy team.");
      return;
    }

    const randomEnemyNames = [];
    const availableNames = [...allPokemonNames];

    while (randomEnemyNames.length < 6) {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      const randomName = availableNames.splice(randomIndex, 1)[0];
      if (randomName) {
        randomEnemyNames.push(randomName);
      }
    }

    setEnemyTeam([]);
    setLoading(true);
    setError(null);
    setIsBattleResultsVisible(true); 

    try {
      const enemyTeamDetails = await Promise.all(
        randomEnemyNames.map(async (name) => {
          await fetchPokemonDetails(name);
          return { name, details: pokemonDetails[name] };
        })
      );
      setEnemyTeam(enemyTeamDetails);
      setBattleResults([]); 
      simulateBattle(team, enemyTeamDetails);
    } catch (error) {
      console.error("Error fetching enemy team details:", error);
      setError("Failed to generate enemy team.");
      setBattleResults(["Error generating enemy team."]); 
    } finally {
      setLoading(false);
    }
  }, [allPokemonNames, fetchPokemonDetails, pokemonDetails, team]);


  const simulateSingleBattle = (pokemon1, pokemon2) => {
    const log = [];
    let winner = null;

    log.push(`\n--- Battle: ${pokemon1.name} vs ${pokemon2.name} ---`);

    const stats = ['hp', 'attack', 'speed'];
    const statWinners = [];

    for (const statName of stats) {
      const stat1 = pokemon1.details?.stats?.find(s => s.name === statName)?.base_stat || 0;
      const stat2 = pokemon2.details?.stats?.find(s => s.name === statName)?.base_stat || 0;

      log.push(`${statName.toUpperCase()}: ${pokemon1.name} (${stat1}) vs ${pokemon2.name} (${stat2}) - Winner: ${stat1 > stat2 ? pokemon1.name : stat2 > stat1 ? pokemon2.name : 'Tie'}`);

      if (stat1 > stat2) {
        statWinners.push(pokemon1.name);
      } else if (stat2 > stat1) {
        statWinners.push(pokemon2.name);
      }
    }

    const pokemon1Wins = statWinners.filter(name => name === pokemon1.name).length;
    const pokemon2Wins = statWinners.filter(name => name === pokemon2.name).length;

    if (pokemon1Wins > pokemon2Wins) {
      winner = pokemon1.name;
    } else if (pokemon2Wins > pokemon1Wins) {
      winner = pokemon2.name;
    } else {
      winner = 'Tie';
    }
    log.push(`-- Battle End: ${winner} wins! --`);
    return { log, winner };
  };


  const simulateBattle = (playerTeam, enemyTeam) => {
    const battleResults = [];
    let overallPlayerWins = 0;
    let overallEnemyWins = 0;

    if (!playerTeam || playerTeam.length === 0 || !enemyTeam || enemyTeam.length === 0) {
      battleResults.push("Cannot start battle: Teams are not complete.");
      setBattleResults(battleResults);
      return;
    }

    const numBattles = Math.min(playerTeam.length, enemyTeam.length);

    for (let i = 0; i < numBattles; i++) {
      const pokemon1 = playerTeam[i];
      const pokemon2 = enemyTeam[i];
      const { log, winner } = simulateSingleBattle(pokemon1, pokemon2);
      battleResults.push(...log);
      if (winner === pokemon1.name) {
        overallPlayerWins++;
      } else if (winner === pokemon2.name) {
        overallEnemyWins++;
      }
    }
    battleResults.push(`\n--- Overall Result: ---`);
    battleResults.push(`Your Team: ${overallPlayerWins} wins`);
    battleResults.push(`Enemy Team: ${overallEnemyWins} wins`);

    if (overallPlayerWins > overallEnemyWins) {
      battleResults.push(`\nOverall Winner: Your Team!`);
    } else if (overallEnemyWins > overallPlayerWins) {
      battleResults.push(`\nOverall Winner: Enemy Team!`);
    } else {
      battleResults.push(`\nOverall Result: It's a Tie!`);
    }

    setBattleResults(battleResults);
  };


  useEffect(() => {
    fetchAllPokemonNames();
    fetchTypes();
  }, [fetchAllPokemonNames, fetchTypes]);


  useEffect(() => {
    setLoading(true);
    setError(null);
    const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
    const endIndex = startIndex + POKEMON_PER_PAGE;
    const currentPokemonNames = filteredPokemonNames.slice(startIndex, endIndex);

    Promise.all(currentPokemonNames.map(name => fetchPokemonDetails(name)))
      .then(details => {
        setPokemonList(currentPokemonNames.map((name, index) => ({ name, details: details[index] })));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching details for current page:", err);
        setError("Failed to load Pokémon details for this page.");
        setLoading(false);
      });
  }, [currentPage, filteredPokemonNames, fetchPokemonDetails]);


  useEffect(() => {
    team.forEach(pokemon => {
      if (!pokemonDetails[pokemon.name]) {
        fetchPokemonDetails(pokemon.name);
      }
    });
  }, [team, fetchPokemonDetails]);


  const handleAddToTeam = (pokemon) => {
    if (team.length < 6 && !team.some(p => p.name === pokemon.name)) {
      setTeam([...team, pokemon]);
    } else if (team.length >= 6) {
      alert("Your team is full!");
    } else {
      alert(`${pokemon.name} is already in your team!`);
    }
  };

  const handleRemoveFromTeam = (name) => {
    setTeam(team.filter(pokemon => pokemon.name !== name));
  };

  const handleClearTeam = () => {
    setTeam([]);
  };

  const toggleTeamVisibility = () => {
    setIsTeamModalVisible(!isTeamModalVisible);
  };

  const openPokemonInfo = async (name) => {
    const details = await fetchPokemonDetails(name);
    setSelectedPokemon({ name, details });
    setIsInfoModalVisible(true);
  };

  const closePokemonInfo = () => {
    setIsInfoModalVisible(false);
    setSelectedPokemon(null);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const results = allPokemonNames.filter(name => name.toLowerCase().includes(query));
    setFilteredPokemonNames(results);
    setTotalPages(Math.ceil(results.length / POKEMON_PER_PAGE));
    setCurrentPage(1);
  };

  const handleTypeChange = (event) => {
    const type = event.target.value;
    setSelectedType(type);
    if (type === 'all') {
      setFilteredPokemonNames(allPokemonNames);
    } else {
      const filtered = allPokemonNames.filter(name => pokemonDetails[name]?.types?.includes(type));
      setFilteredPokemonNames(filtered);
    }
    setTotalPages(Math.ceil(filteredPokemonNames.length / POKEMON_PER_PAGE));
    setCurrentPage(1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleStartBattle = () => {
    generateRandomEnemyTeam();
    setIsBattleResultsVisible(true); 
  }

 
  const BattleLogModal = ({ battleLog, setIsBattleLogVisible, isVisible }) => {
    if (!isVisible) {
      return null; 
    }

    const handleClose = () => {
      setIsBattleLogVisible(false);
    };

   
    const modalStyles = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      zIndex: '1000',
      maxWidth: '90vw',
      maxHeight: '70vh',
      overflowY: 'auto',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'auto',
      border: '2px solid #333'
    };

    const contentStyles = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    }

    const logStyles = {
      textAlign: 'left',
      width: '100%',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      fontFamily: 'PixelEmulator, sans-serif',
      fontSize: '1em',
      color: '#333'
    };

    const closeButtonStyle = {
      padding: '10px 20px',
      backgroundColor: '#a80f0f',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1em',
      transition: 'background-color 0.3s ease',
      fontFamily: 'PixelEmulator, sans-serif',
      marginTop: '15px',
    };

    const headingStyles = {
      color: '#333',
      fontFamily: 'PixelEmulator, sans-serif',
      marginBottom: '15px',
      width: '100%',
      textAlign: 'center',
      marginTop: '0',
      padding: '0',
      fontSize: '1.5em'
    }

    return (
      <div style={modalStyles} className="battle-log-modal">
        <div style={contentStyles} className="battle-log-content">
          <h3 style={headingStyles}>Battle Log</h3>
          <div style={logStyles} className="battle-log-text">
            {battleLog.map((logEntry, index) => (
              <p key={index}>{logEntry}</p>
            ))}
          </div>
          <button style={closeButtonStyle} className="close-battle-log-button" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    );
  };

  
  const renderPokedexView = () => {
    return (
      <div className="pokedex-view">
        <div className="logo-banner">
          <img src={pokemonLogo} alt="Pokemon Logo" className="pokemon-logo-banner" />
        </div>
        <header className="pokedex-info-header">
          <div className="header-left-info">
            <h1>Pokédex</h1>
            <p className="authors">By: Alfaizer Cruza & Kim Philippe Nochefranca</p>
          </div>
          <div className="header-right-info">
            <span
              role="button"
              aria-label="view team"
              style={{ fontSize: '1.5em', marginRight: '5px', cursor: 'pointer', textAlign: 'right', display: 'block' }}
              onClick={toggleTeamVisibility}
            >
              👁
            </span>
            <span className="my-team" style={{ textAlign: 'right', display: 'block' }}>MY TEAM: {team.length}/6</span>
            <div className="battle-buttons-header" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <button className="pro-battle-button" onClick={() => alert('COMING SOON!')}>Pro Battle</button>
              <button className="basic-battle-button" onClick={handleStartBattle}>Basic Battle</button>
            </div>
          </div>
        </header>
        <main>
          <div className="main-content">
            <div className="search-filter-container">
              <input
                type="text"
                placeholder="Search Pokémon..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <select
                className="type-select"
                value={selectedType}
                onChange={handleTypeChange}
              >
                {allTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="pagination-controls-container">
              <div className="pagination-controls">
                <button
                  onClick={goToPreviousPage}
                  className="pagination-button"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={goToNextPage}
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>

            {loading && <p>Loading Pokémon...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="pokemon-list">
              {pokemonList.map(pokemon => (
                <div
                  key={pokemon.name}
                  className="pokemon-item"
                  style={{
                    backgroundColor: pokemon.details?.types?.[0] ? typeColors[pokemon.details.types[0]] : '#f9f9f9'
                  }}
                >
                  {pokemon.details?.spriteUrl ? (
                    <img
                      src={pokemon.details.spriteUrl}
                      alt={pokemon.name}
                      className="pokemon-image"
                    />
                  ) : (
                    <div className="pokemon-image-placeholder">Loading...</div>
                  )}
                  <h3 className="pokemon-name">{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
                  <div className="pokemon-buttons">
                    <button className="info-button" onClick={() => openPokemonInfo(pokemon.name)}>Info</button>
                    <button className="add-to-team-button" onClick={() => handleAddToTeam(pokemon)}>
                      {team.some(p => p.name === pokemon.name) ? 'Added' : 'Add to Team'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isTeamModalVisible && (
            <div className="team-modal">
              <h3>Your Team</h3>
              {team.length === 0 ? (
                <p>Your team is empty.</p>
              ) : (
                <ul className="team-pokemon-list">
                  {team.map(pokemon => (
                    <li key={pokemon.name} className="team-pokemon-item">
                      {pokemon.details?.spriteUrl && (
                        <img
                          src={pokemon.details.spriteUrl}
                          alt={pokemon.name}
                          className="team-pokemon-image"
                        />
                      )}
                      <h4 className="team-pokemon-name">{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h4>
                      {pokemon.details?.stats && (
                        <div className="team-pokemon-stats">
                          {pokemon.details.stats.map(stat => (
                            <p key={stat.name}>{stat.name}: {stat.base_stat}</p>
                          ))}
                        </div>
                      )}
                      {pokemon.details?.abilities && (
                        <p className="team-pokemon-abilities">Abilities: {pokemon.details.abilities.join(', ')}</p>
                      )}
                      <button className="remove-from-team-button" onClick={() => handleRemoveFromTeam(pokemon.name)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <button className="clear-team-button" onClick={handleClearTeam}>Clear All</button>
              <button className="close-modal-button" onClick={toggleTeamVisibility}>Close</button>
            </div>
          )}

          {isInfoModalVisible && selectedPokemon && (
            <div className="info-modal">
              <h3>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h3>
              {selectedPokemon.details?.spriteUrl && (
                <img
                  src={selectedPokemon.details.spriteUrl}
                  alt={selectedPokemon.name}
                  className="pokemon-image"
                />
              )}
              {selectedPokemon.details?.types && (
                <p>Types: {selectedPokemon.details.types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}</p>
              )}
              {selectedPokemon.details?.stats && (
                <ul>
                  {selectedPokemon.details.stats.map(stat => (
                    <li key={stat.name}>{stat.name}: {stat.base_stat}</li>
                  ))}
                </ul>
              )}
              {selectedPokemon.details?.abilities && (
                <p>Abilities: {selectedPokemon.details.abilities.map(ability => ability.charAt(0).toUpperCase() + ability.slice(1)).join(', ')}</p>
              )}
              <button className="styled-close-button" onClick={closePokemonInfo}>Close</button>
            </div>
          )}
          <BattleLogModal
            battleLog={battleResults}
            setIsBattleLogVisible={setIsBattleResultsVisible}
            isVisible={isBattleResultsVisible} 
          />
        </main>
      </div>
    );
  };

  return (
    <div className="pokedex-container">
      {renderPokedexView()}
    </div>
  );
}

export default App;
