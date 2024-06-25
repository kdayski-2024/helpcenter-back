## Install

sudo docker run --name helpcenter-postgres --restart=always -e POSTGRES_PASSWORD=2EXXxcmOB8MoXKpL -e POSTGRES_USER=helpcenter -e POSTGRES_DB=helpcenter -d -p 5462:5432 -v /srv/database/helpcenter:/var/lib/postgresql/data postgres


