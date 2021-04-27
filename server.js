'use strict';

const express = require('express');
require('dotenv').config();
const pg = require('pg');
const methodOverride= require('method-override');
const cors = require('cors');
const server = express();

const superagent = require('superagent');
const PORT = process.env.PORT || 3000;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,
    //  ssl: { 
    //      rejectUnauthorized: false }

         });

server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));
server.use(express.static('./public'));

server.get('/',homePages);
server.get('/product',productHandler);
server.get('pages/maybellineProducts',maybellineProducts);
server.post('/addProduct',insertProduct);
server.get('/addProduct',renderProduct);
server.get('/alreadyAdded',alreadyAdded);
server.get('/details',renderDetails);
server.get('/details/:id',updateProduct);
server.get('/details/:id',deleteProduct);

server.set('view engine', 'ejs');

function homePages(req,res){
  res.render('pages/index');
}

function productHandler(req,res){
    let greater = req.query.greater;
    let less = req.query.less;
    let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=${greater}&price_less_than=${less}'`;
    superagent.get(url).then(data =>{
        let result = data.body.map(val =>{
            return new product(val);
        })
        res.render('pages/product',{data:result});
    })

}

function maybellineProducts (req,res){
    let url = "http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline";
    superagent.get(url).then(data=>{
        let result = data.body.map(val=>{
            return new maybellineProduct(val);
        })

        res.render('pages/maybellineProducts',{data:result});
    })
}

function insertProduct(req,res){
    let {name , img , price ,description }=req.body;
    let saveValue = [name , img , price ,description , 'api'];
    let SQL= 'INSERT INTO makup (name ,  price, img ,description , created_by) VALUES ($1 ,$2,$3,$4,$5);'
    let searchSql = `SELECT * FROM makup WHERE name= '${name}';`
    client.query(searchSql).then(data =>{
        if(data.rows.length === 0){
            client.query(SQL, saveValue).then(()=>{
                res.redirect('/addProduct');
            })
        }else if (data.rows[0].name===name){
            res.redirect('/alreadyAdded');
        }
    })
}

function renderProduct(req,res){
    let SQL = 'SELECT * FROM makup WHERE created_by=$1;';
    let saveValue = ['api'];
    client.query(SQL,saveValue).then(data =>{
        res.render('pages/myCard',{data:data.rows});
    })
}


function alreadyAdded(req,res){
    res.render('pages/alreadyAdded');
}

function renderDetails(req,res){
    let id = req.params.id;
    let SQL = 'SELECT * FROM makup WHERE id=$1;';
    let saveValue=[id];
    client.query(SQL, saveValue).then(data =>{
        res.render('pages/details',{data:data.rows[0]});
    })
}

function updateProduct(req,res){
    let id=req.params.id;
    let saveValue=[id];
    let SQL= 'UPDATE makup SET name = $1, price = $2, img=$3 description = $4 WHERE id=$5;';
    client.query(SQL,saveValue).then(()=>{
        res.redirect(`/details/${id}`);
        
    })
}


function deleteProduct(req,res){
    let id=req.params.id;
    let saveValue=[id];
    let SQL= 'DELETE FROM makup WHERE id=$1;';
    client.query(SQL,saveValue).then(()=>{
        res.redirect('/addProduct');
    })
}



function product(data){
    this.name=data.name;
    this.price= data.price
    this.img = data.image_link
     this.description = data.description
}

function maybellineProduct(data){
    this.name=data.name;
    this.price= data.price
    this.img = data.image_link
     this.description = data.description
}



client.connect()
.then(()=>{
    server.listen(PORT, () => console.log(`Listening on port : ${PORT}`));
})