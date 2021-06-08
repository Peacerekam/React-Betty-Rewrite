// external
import React , { useState, useEffect, useContext } from 'react'
import { useHistory } from "react-router-dom"
import axios from 'axios'

// internal
import GuildInput from '../../components/GuildInput/GuildInput'
import UserDisplay from './components/UserDisplay'
import GuildDisplay from './components/GuildDisplay'
import CustomLoader from '../../components/CustomLoader/CustomLoader'

// context
import { DiscordContext } from '../../App'

const ServerBrowser = (props) => {
    const { 
        user, setUser,
        guilds, setGuilds 
    } = useContext(DiscordContext)
    
    const history = useHistory()
    const [ isLoading, setIsLoading ] = useState(false)
    const { setError } = props

    useEffect(() => {
        loaderWrap(maybeFetchAllData)
    },[])

    const loaderWrap = async (wrappedFunction : any) => {
        setIsLoading(true)
        await wrappedFunction()
        setIsLoading(false)
    }

    const maybeFetchAllData = async () => {
        if (guilds.length > 0 && user['id'] ) return;

        const code = getCode()
        if (code) await grantAccessCode(code)
        await getSetGuilds()
    }

    const getCode = () => {
        const rawParams = window.location.search.split('=')
        const hasCodeInURL = rawParams.length === 2 && rawParams[0] === '?code'
        return hasCodeInURL ? rawParams[1] : null
    }

    const grantAccessCode = async (code : string) => {
        try {
            await axios.get(`/accessToken?code=${code}`)
            history.push('/servers')
        } catch (error){
            setError("There was an error during authentication.")
            console.log(error)
        }
    }

    const getSetGuilds = async () => {
        try {
            const response = await axios.get('/getGuilds')
            setGuilds(response.data.guilds)
            setUser(response.data.user)
        } catch (error){
            setError("There was an error during authentication.")
            history.push('/')
        }
    }


    return (
        <div>

            { !user['id'] ? (
                <>
                    <CustomLoader/>
                    <div className="m-30">Authenticating...</div>
                </>
            ) : (
                <>
                    <GuildInput setError={setError}/>

                    <UserDisplay user={user} className="mt-40 mb-20"/>

                    <div className='guild-list-container'>
                        { isLoading && (
                            <div className='overlay-loader'>
                                <CustomLoader/>
                            </div>
                        ) }

                        <div className={ `${isLoading ? 'disabled' : 'zoom-in-animation' } guild-list` }>
                            { guilds && guilds.map( (guild,i) => <GuildDisplay key={`guild-${i}-${guild.id}`} guild={guild}/> ) }
                        </div>

                    </div>
                </>
            )}
            
        </div>
    )
}

export default ServerBrowser