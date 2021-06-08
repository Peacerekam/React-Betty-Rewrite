// external
import React, { useEffect, useState, createContext } from 'react'
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"

// internal
import DiscordAuth from './pages/DiscordAuth/DiscordAuth'
import ServerBrowser from './pages/ServerBrowser/ServerBrowser'
import ChannelBrowser from './pages/ChannelBrowser/ChannelBrowser'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'
import ErrorPopup from './components/ErrorPopup/ErrorPopup'

// styles
import 'overlayscrollbars/css/OverlayScrollbars.css'
import './App.scss'

interface Guild {
    id? : string,
    availableChannels? : []
}

export const DiscordContext = createContext({ 
    guilds: [], setGuilds: (g) => {},
    user:   {}, setUser:   (u) => {}
})

function App() {

    const [ user,   setUser   ] = useState({})
    const [ error,  setError  ] = useState('') 
    const [ guilds, setGuilds ] = useState<Guild[]>([]) 

    const setGuildsWrapper = g => setGuilds(g)
    const setUserWrapper   = u => setUser(u)

    useEffect(() => {
        document.title = "Betty Discord Image Browser"
     }, [])

    return (
        <div className="App">
            
            <Router>

                {/* debug navigation */}
                {/* <div className="mb-20" style={{zIndex: 9999, opacity: '0.5', position:'absolute', right: '50px',top: '50px'}}>
                    <div className="mb-10">d e b u g</div>
                    <Link className="mr-10" to="/">Auth</Link> 
                    <Link className="mr-10" to="/servers">Guilds</Link>
                    <Link to="/channels">Channels</Link> 
                </div> */}

                { error && <ErrorPopup error={error} setError={setError}/> }
                
                <div className="content">  

                    <DiscordContext.Provider 
                        value={{ 
                            guilds, user, 
                            setGuilds: setGuildsWrapper,
                            setUser : setUserWrapper
                        }}
                    >
                        <Switch>

                            <Route exact path="/">
                                <DiscordAuth setError={setError} />
                            </Route>

                            <Route path="/servers">
                                <ServerBrowser setError={setError} />
                            </Route>

                            <Route path="/channels">
                                <ChannelBrowser setError={setError} />
                            </Route>

                            <Route path="*" component={NotFoundPage} />

                        </Switch>
                    </DiscordContext.Provider>

                </div>
            </Router>
        </div>
    )
}

export default App
