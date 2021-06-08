import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import { useHistory } from "react-router-dom"

const NotFoundPage = (props) => {
    const history = useHistory()

    const goToMainPage = () => history.push('/')

    return (
        <div>
            <div className="not-found-container mb-30">
                <FontAwesomeIcon icon={faBan} size="10x"/> 
                <span className="not-found-code ml-20">404</span>
                <div className="not-found-text">Page not found</div>
            </div>
            <button className="fancy-button-orange pointer" onClick={ goToMainPage }>
                CLICK HERE TO GO BACK
            </button>
        </div>
    )
}

export default NotFoundPage