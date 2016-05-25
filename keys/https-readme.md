# NodeJS on SSL https setup notes
Updated: May 23, 2016



## Set up instructions
1. create private key (quindar-key.pem)
2. create CSR certificate signing request (certrequest.csr) - re-use private key
3. sign CSR certificate to create a usable client certificate (quindar-cert.pem)


horologium-2:keys ray$ openssl genrsa -out quindar-key.pem 1024 
Generating RSA private key, 1024 bit long modulus
..........++++++
.........................................................................++++++
e is 65537 (0x10001)

horologium-2:keys ray$ openssl req -new -key quindar-key.pem -out certrequest.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:Palo Alto
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Audacy Corp
Organizational Unit Name (eg, section) []:Quindar
Common Name (e.g. server FQDN or YOUR name) []:audacyDevOps
Email Address []:ray.lai@audacy.space

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:race2space
An optional company name []:


horologium-2:keys ray$ openssl x509 -req -in certrequest.csr -signkey quindar-key.pem -out quindar-cert.pem
Signature ok
subject=/C=US/ST=California/L=Palo Alto/O=Audacy Corp/OU=Quindar/CN=audacyDevOps/emailAddress=ray.lai@audacy.space
Getting Private key

