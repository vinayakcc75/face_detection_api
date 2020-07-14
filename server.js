const express=require('express');
const bodyParser= require('body-parser');
const app=express();
const cors=require('cors');
const bcrypt = require('bcrypt-nodejs');
var knex = require('knex');

const db=knex({   
	client: 'pg',
	connection: {
	  connectionString : process.env.DATABASE_URL,
	  ssl:true
	}
  });
  
app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=>{
	res.json('It is working');
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

app.listen(process.env.PORT||3000,()=>{
	console.log('Listening to Port',process.env.PORT)
});

/*
/--> res =this is working
/signin -->POST =unsuccessful
/register --> POST = user
/profile/:userid -->GET user
/image -->PUT -->user
*/