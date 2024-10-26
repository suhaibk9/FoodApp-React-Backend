const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');

const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const API_URL =
  'https://www.swiggy.com/dapi/restaurants/list/v5?lat=12.9352403&lng=77.624532&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_L';
const MENU_URL =
  'https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=12.9352403&lng=77.624532&restaurantId';
const CDN_URL = `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/`;
//Cors
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

//EndPoint for the List of restaurants

app.get('/restaurants', async (req, res) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch restaurant data' });
  }
});

//EndPoint for the Menu of the restaurant
app.get('/restaurants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${MENU_URL}=${id}&submitAction=ENTER`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch menu data' });
  }
});
//Stripe

app.post('/create-checkout-session', async (req, res) => {
  const { totalAmount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Order Total',
            },
            unit_amount: totalAmount, // Ensure the amount is in paise for INR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/payement-failed`,
    });

    res.json({ url: session.url }); // Send session URL to the frontend
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
