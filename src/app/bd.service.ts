import * as firebase from 'firebase';
import { Injectable } from '@angular/core';
import { Progresso } from './progresso.service';

@Injectable()
export class Bd {

    constructor(private progresso: Progresso) { }

    public publicar(publicacao: any): void {
        
        firebase.database()
            .ref(`publicacoes/${btoa(publicacao.email)}`)
            .push( { titulo: publicacao.titulo } )
            .then((resposta: any) => {
                let nomeImagem = resposta.key;
                firebase.storage().ref()
                .child(`imagens/${ nomeImagem }`)
                .put(publicacao.imagem)
                .on(
                    firebase.storage.TaskEvent.STATE_CHANGED,
                    (snapshot: any) => {
                        this.progresso.status = 'andamento';
                        this.progresso.estado = snapshot;
                    },
                    (error) => {
                        this.progresso.status = 'erro';
                    },
                    () => {
                        this.progresso.status = 'concluido';
                    }
                );
            });
    }

    public consultaPublicacoes(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            firebase
                .database()
                .ref(`publicacoes/${btoa(email)}`)
                .orderByKey()
                .once('value')
                .then((snapshot: any) => {
                    let publicacoes: Array<any> = [];

                    snapshot.forEach(childSnapshot => {
                        let publicacao = childSnapshot.val();
                        publicacao.key = childSnapshot.key;

                        publicacoes.push(publicacao);
                    });
                    return publicacoes.reverse();
                })
                .then((publicacoes: any) => {

                    publicacoes.forEach( (publicacao) => {
                        firebase
                        .storage()
                        .ref()
                        .child(`imagens/${ publicacao.key }`)
                        .getDownloadURL()
                        .then((url: string) =>{
                            publicacao.url_imagem = url;

                            firebase
                                .database()
                                .ref(`usuario_detalhe/${ btoa(email) }`)
                                .once('value')
                                .then((snapshot: any) =>{
                                    publicacao.nomeUsuario = snapshot.val().nomeUsuario;
                                });
                        });
                    });
                    resolve(publicacoes);
                });
        });
    }
}