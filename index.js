const express = require('express')
const axios = require('axios')
const Keyv = require('keyv')

const app = express()
const port = process.env.PORT || 3000

// Create a Keyv instance for caching
const cache = new Keyv()

// Middleware for caching
app.use('/token-supply', async (req, res, next) => {
  try {
    const cachedData = await cache.get('tokenSupplyData')

    if (cachedData) {
      res.json({ tokenSupply: cachedData })
    } else {
      next()
    }
  } catch (error) {
    console.error('Cache Error:', error.message)
    next()
  }
})

app.get('/token-supply', async (req, res) => {
  try {
    // Fetch data from the external API
    const url = 'https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x1cfa5641c01406ab8ac350ded7d735ec41298372'
    const response = await axios.get(url)
    const data = response.data

    if (data.status === '1') {
      const tokenSupply = parseFloat(data.result) / 1e18

      // Cache the token supply data for 1 hour (3600 seconds)
      await cache.set('tokenSupplyData', tokenSupply, 3600)

      res.send(tokenSupply.toString()) // Send only the numeric value as plain text
    } else {
      res.status(500).json({ error: 'API Error', message: data.message })
    }
  } catch (error) {
    res.status(500).json({ error: 'Script Error', message: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
