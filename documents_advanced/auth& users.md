
# @Matches : is a class validator decorator 
> nestjs validates the password against regex 
> if it doesn't match validation fails 

- /^(?=.*[A-Za-z])(?=.*\d).+$/
> here / / it is the expression literals 

- ^ start of a string 
- (?=..) positive lookahead 
- . means any character all can be matched by .
- * zero or more occurances 
- [A-Z a-z] here it includes 
- (?=.*\d) the string must contain atleast one digit 
- \d digits from 0-9
- .+ here it tells one or more characters 
- $ end of the string 

> Example :
- @Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
)
> here the password must contain 8 letters including atleat one lowercase letter , one uppercase letter , one digit and one special character 
> here we can use password length you can use {} quantifier in the regex like {8,20}