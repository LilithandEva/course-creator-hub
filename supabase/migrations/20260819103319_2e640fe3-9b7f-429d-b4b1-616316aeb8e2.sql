update public.testimonials set photo_url = v.url from (values
('Laura Méndez','/__l5e/assets-v1/bb69b7b8-60ee-43d1-bbb8-89a09e1357d3/laura.jpg'),
('Diego Ferrán','/__l5e/assets-v1/07e93ce9-1d5f-4ff4-8783-9bf6b106e364/diego.jpg'),
('Marta Ibáñez','/__l5e/assets-v1/96385069-5f4e-45ef-b056-44deb868bf79/marta.jpg'),
('Álvaro Ruiz','/__l5e/assets-v1/95c93eb6-a25d-40a4-a2ec-c29ca7735756/alvaro.jpg'),
('Nerea Solís','/__l5e/assets-v1/1a6d6d05-aa33-43ab-b23b-5897f9a8e78f/nerea.jpg'),
('Sergio Delgado','/__l5e/assets-v1/2149a912-61de-4257-ba34-9a0d95f12cf0/sergio.jpg'),
('Patricia Gómez','/__l5e/assets-v1/4789dbd5-c5ca-4581-9049-86e58b5265c5/patricia.jpg'),
('Iván Carrasco','/__l5e/assets-v1/9568499f-55e1-4bbd-971c-6839f08bff00/ivan.jpg'),
('Cristina Vera','/__l5e/assets-v1/ee598f74-b5ed-462c-a40a-ff50d03007d6/cristina.jpg')
) as v(name,url) where public.testimonials.name = v.name;