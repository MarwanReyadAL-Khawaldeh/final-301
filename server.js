'use strict';

require('dotenv').config();

const express= require('express');

const cors= require('cors');

const superagent= require('superagent');

const pg = require('pg');

const methodOverride= require('method-override');

const PORT=process.env.PORT||3000;

const server=express();

server.use(cors());

server.use(express.urlencoded({ extended: true }));

server.use(methodOverride('_method'));
server.use(express.static('./public'));

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });



server.get('/',homePages);
server.get('/product',productHandler);
server.get('/maybellineProducts',maybellineProducts);
server.post('/addProduct',insertProduct);
server.get('/addProduct',renderProduct);
server.get('/alreadyAdded',alreadyAdded);
server.get('/details/:id',renderDetails);
server.put('/details/:id',updateProduct);
server.delete('/details/:id',deleteProduct);

server.set('view engine', 'ejs');

function homePages(req,res){
  res.render('pages/index');
}

function productHandler(req,res){
    let from=req.query.from;
    let to= req.query.to;
    let url=`http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=${from}&price_less_than=${to}`;
    superagent.get(url).then(data =>{
        let dataBody=data.body;
        let result = dataBody.map(val =>{
            return new product(val);
        });
        res.render('pages/product',{data:result});
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });

}

function maybellineProducts (req,res){
    let url = "http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline";
    superagent.get(url).then(data=>{
        let result = data.body.map(val=>{
            return new product(val);
        });

        res.render('pages/maybellineProducts',{data:result});
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
}

function insertProduct(req,res){
    let {name , img , price ,description }=req.body;
    let saveValue = [name , img , price ,description ];
    let SQL= 'INSERT INTO makup (name ,img,price ,description) VALUES ($1 ,$2,$3,$4);';
    let searchSql = `SELECT * FROM makup WHERE name= '${name}';`
    client.query(searchSql).then(data =>{
        if(data.rows.length === 0){
            client.query(SQL, saveValue).then(()=>{
                res.redirect('/addProduct');
            });
        }else if (data.rows[0].name===name){
            res.redirect('/alreadyAdded');
        }
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
}

function renderProduct(req,res){
    let SQL = 'SELECT * FROM makup;';
    client.query(SQL).then(data =>{
        res.render('pages/myCard',{data:data.rows});
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
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
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
}

function updateProduct(req,res){
    let id=req.params.id;
    let saveValue=[id];
    let SQL= 'UPDATE makup SET name = $1, img = $2, price=$3 description = $4 WHERE id=$5;';
    client.query(SQL,saveValue).then(()=>{
        res.redirect(`/details/${id}`);
        
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
}


function deleteProduct(req,res){
    let id=req.params.id;
    let saveValue=[id];
    let SQL= 'DELETE FROM makup WHERE id=$1;';
    client.query(SQL,saveValue).then(()=>{
        res.redirect('/addProduct');
    }).catch(() => {

        res.status(404).send('Page Not Found.');
    });
}



function product(data){
    this.name=data.name;
    this.price= data.price;
    this.img = data.image_link;
     this.description = data.description;
}

client.connect().then(()=>{
    server.listen(PORT,()=>{
        console.log(`listening on: ${PORT}`)
    });
});

