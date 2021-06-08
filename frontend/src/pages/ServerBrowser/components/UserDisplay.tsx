// external
import React  from 'react'
import { useHistory } from "react-router-dom"

const UserDisplay = (props) => {
    const history = useHistory()
    const { user, className } = props

    // not a real log-out but whatever
    const handleLogOut = () => history.push('/')

    return (
        <div tabIndex={0} className={`${className || ''} logged-user pointer`} onClick={handleLogOut} title="Click here to log out" >
            <img className="avatar mr-10" src={ getUserAvatar(user) } />
            <span className="username">{ getUserName(user) }</span>
        </div>
    )
}

export const defaultAv = require('../../../assets/images/defaultAv.png')
export const getUserAvatar = (u) => u?.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}` : defaultAv.default
export const getUserName = (u) => u?.username || "Unknown"
export default UserDisplay