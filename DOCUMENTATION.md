# CS571 HW6 API Documentation

## At a Glance

All routes are relative to `https://www.coletnelson.us/cs571/f22/hw6/api/`

| Method | URL | Purpose | Return Codes |
| --- | --- | --- | --- |
| `GET`| `/bakery/items` | Get all bakery items with their associated name, price, image url, and upper bound order limit. | 200, 304 |
| `GET` | `/bakery/images/:itemName`| Get the image for the specified item. | 200, 304, 404 |
| `GET` | `/bakery/order` | Get the most recent orders. | 200, 304 |
| `POST` | `/bakery/order` | Make an order. | 200, 400, 401, 413 |

An unexpected server error `500` *may* occur during any of these requests. It is likely to do with your request. Make sure that you have included the appropriate headers and, if you are doing a POST, that you have a properly formatted JSON body. If the error persists, please contact a member of the course staff.

## In-Depth Explanations

### Getting all Bakery Items
`GET` `https://www.coletnelson.us/cs571/f22/hw6/api/bakery/items`

A `200` (new) or `304` (cached) response will be sent with the list of all bakery items.

```json
[
    {
        "name": "muffin",
        "price": 1.5,
        "img": "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/muffin",
        "upperBound": 8
    },
    {
        "name": "donut",
        "price": 1,
        "img": "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/donut",
        "upperBound": 8
    },
    {
        "name": "pie",
        "price": 6.75,
        "img": "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/pie",
        "upperBound": 2
    },
    {
        "name": "cupcake",
        "price": 2,
        "img": "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/cupcake",
        "upperBound": 4
    },
    {
        "name": "croissant",
        "price": 0.75,
        "img": "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/croissant",
        "upperBound": 6
    }
]
```

The `name` of each item is guaranteed to be unique.

### Getting A Bakery Image

`GET` `https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/:itemName`

There is no get all images; you must get an image for a particular `:itemName`. This returns a `200` or `304` with the associated PNG image. If you request an invalid `:itemName`, a `404` will be returned.

### Getting Recent Orders
`GET` `https://www.coletnelson.us/cs571/f22/hw6/api/bakery/order`

A `200` or `304` with the 25 most recent orders will be returned, including the order's id, number of items ordered, who placed the order, and when the order was placed.

```json
{
    "msg": "Successfully got the latest orders!",
    "orders": [
        {
            "id": 2,
            "username": "CTNELSON2",
            "numMuffin": 4,
            "numDonut": 1,
            "numPie": 0,
            "numCupcake": 1,
            "numCroissant": 1,
            "placedOn": "2022-10-31 15:54:05"
        },
        {
            "id": 1,
            "username": "CTNELSON2",
            "numMuffin": 2,
            "numDonut": 2,
            "numPie": 0,
            "numCupcake": 0,
            "numCroissant": 0,
            "placedOn": "2022-10-31 15:44:37"
        }
    ]
}
```

The `placedOn` field contains the time that the server processed the order formatted as a SQLite UTC string.

### Creating an Order

`POST` `https://www.coletnelson.us/cs571/f22/hw6/api/bakery/order`

An order can be placed by performing a `POST` to the order endpoint. An order must contain the number of items being ordered as well as a `refCode`, provided in a seperate email to you. An order must have more than 0 items being bought, but fewer than the upper-bound for that item.

**Example Request Body**

```json
{
    "muffin": 3,
    "donut": 2,
    "pie": 0,
    "cupcake": 0,
    "croissant": 2,
    "refCode": "bid_999999999999"
}
```

Upon a successful order, a `200` will be returned...

```json
{
    "msg": "Successfully made order!",
    "id": 10,
    "placedOn": "2022-10-31 17:00:25"
}
```

The `placedOn` field contains the time that the server processed the order formatted as a SQLite UTC string.

If a field is forgotten (e.g. forgetting to specify how many cupcakes are ordered), a `400` will be returned...

```json
{
    "msg": "A request must contain integers 'muffin', 'donut', 'pie', 'cupcake', and 'croissant'"
}
```

If a `refCode` is invalid or not provided in the body of the request, a `401` will be returned...

```json
{
    "msg": "An invalid refCode was provided."
}
```

If too many items (or no items at all) are ordered, a `413` will be returned...

```json
{
    "msg": "You can only order between 0 and the upper bound of each type, and you must order something!"
}
```
