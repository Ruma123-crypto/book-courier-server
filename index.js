const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT||3000


app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Wellcome Ouer BookCourier Services')
})

app.listen(port, () => {
  console.log(`Wellcome Ouer BookCourier Services on port ${port}`)
})  