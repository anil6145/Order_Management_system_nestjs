
## why not send email and password everytime :
> security risk : sending your password over the internet with every click or page load exposes it more often hackers could intercept it

> databse slowdown  : if the server has to check your email and password in the database for every single click the website will run very slowly

> it makes apps slow and difficult to use


## with JWT :
> login once : your sends email and password only the first time 
> get  a token : the server checks your details if they are correct the server creates a jwt . 

> the token is signed code that proves who you are and when you loged in 

> save the token : for all future requests , your app sends the jwt instead of your password 

> verify quickly : the server checks the token 
> it doesn't need to look up your password in the databse  
> it knows you are authorized 