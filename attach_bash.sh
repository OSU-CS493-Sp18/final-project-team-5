docker run --rm -it	\
	--network final-project-team-5_default \
	mongo:latest \
	mongo --host final-project-team-5_mongodb_1	\
		--username admin	\
		--password admin	\
		--authenticationDatabase gamemaster

#
# docker run --rm -it	\
# 	--network assignment-3-shephern_default \
# 	mongo:latest \
# 	mongo --host mongo	\
# 		--username apiLogin	\
# 		--password securepassword123	\
# 		--authenticationDatabase assign3db
