## Install

sudo docker run --name helpcenter-postgres --restart=always -e POSTGRES_PASSWORD=pwd -e POSTGRES_USER=usr -e POSTGRES_DB=db -d -p 5462:5432 -v /srv/database/db:/var/lib/postgresql/data postgres
