db.createUser({
  user: "someone",
  pwd: "something",
  roles: [{ role: "readWrite", db: "businesses" }]
})
