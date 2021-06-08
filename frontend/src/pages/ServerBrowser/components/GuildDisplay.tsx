// external
import React  from 'react'
import { useHistory } from "react-router-dom"

const GuildDisplay = (props) => {
    const history = useHistory()
    const { guild } = props

    const guildIcon = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}`
    
    const handleGuildClick = () => history.push(`/channels/${guild.id}`)
    
    const getChannelCountText = (count) => `${count} channel${count > 1 ? 's' : ''} available`

    const isUnavailable = guild.availableChannels.length === 0

    return (
        <div tabIndex={isUnavailable ? -1 : 0} className={`${ isUnavailable ? 'unavailable' : ''} guild-display pointer p-10`} onClick={handleGuildClick}>
            <img className="guild-icon mr-20" src={ guildIcon } />

            <div className="guild-details">
                
                <div className="guild-name">
                    {guild.name}
                </div>

                <div className="guild-channel-count">
                    { guild.availableChannels.length === 0 ? (
                        "NOT IN DATABASE"
                    ) : (
                        getChannelCountText(guild.availableChannels.length)
                    )} 
                </div>

            </div>
        </div>
    )
}

export default GuildDisplay