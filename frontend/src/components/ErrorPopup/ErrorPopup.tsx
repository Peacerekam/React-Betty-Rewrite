// external
import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

// styles
import './styles.scss'

const ErrorPopup = (props) => {
    const { error, setError } = props

    useEffect(() => {
        setTimeout( () => setError('') , 4000 )
    },[])

    const handleClickError = () => setError('')

    return (
        <div className="error-container pointer" onClick={handleClickError} title="Hide error">
            <FontAwesomeIcon icon={faExclamationCircle}/> 
            <div className="error-text">{ error }</div>
        </div>
    )
}

export default ErrorPopup