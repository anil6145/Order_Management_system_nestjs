
import { SetMetadata } from '@nestjs/common';
// SetMetadata() allows us to attach metadata to a controller or route 

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// here IS_PUBLIC_KEY is a variable name here the key used to identify wheather a route is public 

// here key is isPublic and value is true 

// here we can also write like this 
//  export const Public = () => SetMetadata('isPublic', true);
