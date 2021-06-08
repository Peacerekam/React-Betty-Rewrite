import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import axios from 'axios'

axios.defaults.baseURL = 'http://127.0.0.1:5050/api'
axios.defaults.withCredentials = true

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
)
