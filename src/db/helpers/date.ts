let dateQueue = Promise.resolve(Date.now())

export function getUniqueDate(): Promise<number> {
  return new Promise<number>((resolve) => {
    dateQueue = dateQueue.then((prev) => {
      let date = Date.now()
      if (date === prev) {
        date++
      }
      resolve(date)
      return date
    })
  })
}
