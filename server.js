const express=require('express');
const bodyParser= require('body-parser');
const app=express();
const cors=require('cors');
const bcrypt = require('bcrypt-nodejs');
var knex = require('knex');

const db=knex({
	client: 'pg',
	connection: {
	  host : '127.0.0.1',
	  user : 'vinayak',
	  password : '',
	  database : 'smart-brain'
	}
  });
  
app.use(bodyParser.json());
app.use(cors());

const database={
	users:[
	{
		id:'123',
		name:'John',
		email:'john@gmail.com',
		password:'cookies',
		entries:0,
		joined:new Date()
	},
	{
		id:'1234',
		name:'Sally',
		email:'sally@gmail.com',
		password:'bananas',
		entries:0,
		joined:new Date()
	}
]
};


app.get('/',(req,res)=>{
	res.json(database.users);
})
 
app.post('/signin', (req,res)=>{
	db.select('email','hash').from('login')
	.where( 'email' , '=' , req.body.email )
	.then(data=>{
		const isValid=bcrypt.compareSync(req.body.password,data[0].hash);
		if(isValid){
			return db.select('*').from('users')
			.where('email','=',req.body.email)
			.then(user=>{
				console.log(user[0])
				res.json(user[0])
			})
			.catch(err=>res.status(400).json('Unable to get user'))
		}
	})
	.catch(err=>res.status(400).json('Wrong credentials'))
})

app.post('/register', (req,res)=>{
	const {email,name,password} = req.body;
	var hash=bcrypt.hashSync(password);
	db.transaction(trx=>{
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
			return trx('users')
			.returning('*')
			.insert({
				email:loginEmail[0],
				name:name,
				joined:new Date()
			}).then(user=>{
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err=>res.status(404).json('unable to register'))
	
})

app.get('/profile/:id',(req,res)=>{
	const {id} =req.params;
	db.select('*').from('users').where({
		id:id
	})
	.then(user=>{
		console.log(user[0])
		if(user.length>0){
			res.json(user[0]);
		}
		else{
			res.status(400).json('Not Found')
		}
	})
	.catch(err=>res.status(400).json('Not able to get user'))
})

app.put('/image',(req,res)=>{
	const {id}=req.body;
	db('users')
  .where('id', '=', id)
  .increment('entries',1)
  .returning('entries')
  .then(entries=>res.json(entries))
  .catch(err=>res.status(400).json('unable to get entries'))
})

app.listen(3000);

/*
/--> res =this is working
/signin -->POST =unsuccessful
/register --> POST = user
/profile/:userid -->GET user
/image -->PUT -->user
*/