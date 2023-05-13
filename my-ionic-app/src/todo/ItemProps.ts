export interface ItemProps {
  _id?: string;
  title: string;
  releaseDate: Date;
  rented: boolean;
  noOfRentals: number;
  lat: number;
  lng: number;
  photoPath: string;
}
