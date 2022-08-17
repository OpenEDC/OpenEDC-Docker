# Demo
A public accessible application is availabe at [OpenEDC](https://mdm.mi.uni-heidelberg.de/openedc). The application uses the browser indexed db.

# Deploy locally
For easy deployment of a locally hosted OpenEDC-Server we provide docker compose files in this repository. A collection of possible commands can be found below. Be aware that executing docker compose commands on windows requires having installed [Docker Desktop](https://docs.docker.com/desktop/windows/install/).
As soon as Docker Desktop is installed and running, open a PowerShell in your repository folder and execute one of the following commands.

## Hosting a basic server

The simplest way of hosting your own instance locally is cloning this repository via 
```
git clone https://github.com/OpenEDC/OpenEDC-Docker.git
``` 
and executing the following command within the cloned directory OpenEDC-Docker:
```
cd OpenEDC-Docker
docker-compose up
```
This way an instance is hosted on port 3000 with the name "default". This instance is already pre-initialized, meaning you need credentials to login (User: Admin, Password: Openedctest1). Since it is fully hosted inside the created container so all changes to data are lost when deleting the docker container.
You can access it in your browser under http://localhost:3000.

## Configure instance
There is a varity of possible configurations. The easiest way to make use of them is by executing the provided _openedc-run.sh_ script for the bash shell. Unfortunately, you cannot simply run bash scripts in Powershell. One way of executing them on Windows machines is by using the **git bash**.
The following flags and configurations can be set:
* -w: Additionally deploys a nginx webserver and redirects the name to the port, so the created instance is available under http://localhost/${name} (default name is "default")
* -p: This flags links your repository folder to the OpenEDC-Server folder inside the container, meaning that all data changes are not store inside the container but in your repository folder. So all data is persitent even when deleting the container.
* -d: When setting this flag, the command is executed in the background, meaning you will not see the server console outputs and can reuse the same console window.
* -o: Opens the instance in the browser after creating it. Does only work when setting the -d flag.

Port and Name of the instance can also be specified by appending them to the command.
An example would look like this:
```
./openedc-run -wpdo 3000 yourname
```

### SSL
With the nginx installed by setting the -w flag comes self signed certificate, so the instance is also available under https://localhost/${name}. The reason for this being necessary lies in the requirements of the used web crypto api. By enabling https you are able to deploy the docker image on a vm and make it accessible to other people. Please note that you have to accept the self signed certificate in your browser.
You **have to** use the **-w** flag when using the script or *-f docker-compose.nginx.yml* when using the raw command (see below @Executing manually).

## With Powershell
As written above, the best way is using the git bash. There are other ways of making the configuration possible with Powershell.

### Install Ubuntu WSL
You can install Ubuntu WSL additionally to docker wsl. A full documentation can be found [here](https://docs.microsoft.com/de-de/windows/wsl/install). What you need is the following command:
```
wsl --install -d Ubuntu-20.04 2
```
After installing Ubuntu wsl, you can integrate Ubuntu-20.04 with docker. This option can be found in Settings->Resources->Wsl Integration. Afterwards you can execute the given bash script in your PowerShell.

### Executing manually
It is also possible to enter the commands manually. Port and Name must be set via environment variables like the following:
```
 $env:PORT='3001'; $env:NAME='yourname'; docker-compose -f docker-compose.yml -p "openedc-${env:PORT}" up --remove-orphans
```

You can also include nginx or productive mode (linking the data volume to the container) by expanding the command:
```
 $env:PORT='3001'; $env:NAME='yourname'; docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.nginx.yml -p "openedc-${env:PORT}" up --remove-orphans
```
If you want to run it in the background, just append -d after the docker-compose up command:
```
 $env:PORT='3001'; $env:NAME='yourname'; docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.nginx.yml -p "openedc-${env:PORT}" up -d --remove-orphans
```
