// external
import React from 'react'

// internal
import GuildInput from '../../components/GuildInput/GuildInput'

const DiscordAuth = (props) => {
    const { setError } = props

    const handleDiscordAuth = () => {
        const oauthURL   = 'https://discord.com/api/oauth2/authorize'
        const clientID   = '675458545809883149'
        const redirectTo = encodeURI('http://localhost:3000/servers')
        const scope      = encodeURI('identify guilds')

        window.location.href = `${oauthURL}?client_id=${clientID}&redirect_uri=${redirectTo}&response_type=code&scope=${scope}`
    }

    return (
        <div>
            <GuildInput setError={setError} />

            <div className="m-20">or...</div>
            
            <button className="fancy-button-orange pointer" onClick={ handleDiscordAuth }>
                Authenticate with Discord
            </button>
        </div>
    )
}

export default DiscordAuth