// external
import React, { useState } from 'react'
import { useHistory } from "react-router-dom"

// style
import './styles.scss'

const GuildInput = (props) => {
    const history = useHistory()
    const { setError } = props
    const [ guildID, setGuildID ] = useState('')
    
    // nothing fancy, just go to the servers page
    const handleClick = () => {
        if (guildID !== ''){
            history.push(`/channels/${guildID}`)
        } else {
            setError('Please enter Server ID')
        }
    }

    const handleInputChange = (event) => setGuildID(event.target.value)

    return (
        <div className="fancy-input-container">
            <input 
                onChange={handleInputChange} 
                placeholder="Server ID"
                maxLength={20}
                autoComplete="off" 
                type="text"
                tabIndex={0} 
            />
            <span 
                className="fancy-label"
                onClick={handleClick} 
                tabIndex={0} 
            >
                {">"}
            </span>
        </div>
    )
}

export default GuildInput